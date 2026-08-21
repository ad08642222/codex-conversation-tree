const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');

const APP_DIR = __dirname;
const CDP_PORT = 9239;
const TREE_PORT = 47831;
const CONTROL_PORT = 9240;
const INJECT_SOURCE = fs.readFileSync(path.join(APP_DIR, 'inject.js'), 'utf8');
const loadedFrames = new Set();

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function reachable(url, timeout = 800) {
  try {
    return (await fetch(url, { signal: AbortSignal.timeout(timeout) })).ok;
  } catch {
    return false;
  }
}

function powershell(script, options = {}) {
  return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
}

function codexExecutable() {
  const result = powershell('(Get-AppxPackage OpenAI.Codex).InstallLocation');
  const install = result.stdout.trim();
  const executable = path.join(install, 'app', 'ChatGPT.exe');
  if (!install || !fs.existsSync(executable)) throw new Error('找不到已安装的 Codex Windows 应用');
  return executable;
}

function mainCodexProcesses() {
  const script = [
    "Get-CimInstance Win32_Process -Filter \"Name='ChatGPT.exe'\"",
    "| Where-Object { $_.CommandLine -notmatch '--type=' }",
    "| Select-Object -ExpandProperty ProcessId",
  ].join(' ');
  return powershell(script).stdout.split(/\r?\n/).map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

async function closeRunningCodex() {
  const ids = mainCodexProcesses();
  if (!ids.length) return;
  const idList = ids.join(',');
  const script = [
    `$ids = @(${idList})`,
    'foreach ($id in $ids) {',
    '  $p = Get-Process -Id $id -ErrorAction SilentlyContinue',
    '  if ($p) { [void]$p.CloseMainWindow() }',
    '}',
  ].join('; ');
  powershell(script);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!mainCodexProcesses().length) return;
    await sleep(250);
  }
  for (const id of ids) {
    spawnSync('taskkill.exe', ['/PID', String(id), '/F'], { windowsHide: true, stdio: 'ignore' });
  }
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (!mainCodexProcesses().length) return;
    await sleep(250);
  }
  throw new Error('Codex 仍在运行。请先退出后台驻留的 Codex，再重新双击“启用主窗口会话树”。');
}

async function ensureTreeServer() {
  if (await reachable(`http://127.0.0.1:${TREE_PORT}/api/health`)) return;
  const child = spawn(process.execPath, ['--no-warnings', path.join(APP_DIR, 'server.js')], {
    cwd: APP_DIR,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: {
      ...process.env,
      CODEX_TREE_PORT: String(TREE_PORT),
      CODEX_TREE_EMBEDDED: '1',
      CODEX_TREE_OWNER_PID: String(process.pid),
    },
  });
  child.unref();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (await reachable(`http://127.0.0.1:${TREE_PORT}/api/health`)) return;
    await sleep(150);
  }
  throw new Error('会话树只读服务未能启动');
}

function launchMainProfileCodex() {
  const child = spawn(codexExecutable(), [
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${CDP_PORT}`,
    `--remote-allow-origins=http://127.0.0.1:${CDP_PORT}`,
  ], { detached: true, stdio: 'ignore', windowsHide: false });
  child.unref();
}

function acquireSingleton() {
  return new Promise((resolve, reject) => {
    const server = net.createServer((socket) => socket.end('ok'));
    server.unref();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') resolve(null);
      else reject(error);
    });
    server.listen(CONTROL_PORT, '127.0.0.1', () => resolve(server));
  });
}

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }

  open() {
    return new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true });
      this.ws.addEventListener('error', reject, { once: true });
      this.ws.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        if (!message.id || !this.pending.has(message.id)) return;
        const pending = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
      });
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() { this.ws.close(); }
}

async function targets() {
  const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`, {
    signal: AbortSignal.timeout(1200),
  });
  return (await response.json()).filter((target) => (
    target.type === 'page' && (target.url?.startsWith('app://') || target.title === 'Codex')
  ));
}

async function inject(target) {
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.setBypassCSP', { enabled: true });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: INJECT_SOURCE });
    const result = await cdp.send('Runtime.evaluate', {
      expression: INJECT_SOURCE,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '界面注入失败');
  } finally {
    cdp.close();
  }
}

function findTreeFrames(node, output = []) {
  if (node?.frame?.name?.startsWith('codex-tree-')) output.push(node.frame);
  for (const child of node?.childFrames || []) findTreeFrames(child, output);
  return output;
}

async function treeDocument() {
  const response = await fetch(`http://127.0.0.1:${TREE_PORT}/?embedded=1`, {
    signal: AbortSignal.timeout(1500),
  });
  if (!response.ok) throw new Error(`会话树页面 HTTP ${response.status}`);
  const html = await response.text();
  return html.replace('<head>', `<head><base href="http://127.0.0.1:${TREE_PORT}/">`);
}

async function loadFrames(target) {
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  try {
    await cdp.send('Page.enable');
    await cdp.send('Page.setBypassCSP', { enabled: true });
    const { frameTree } = await cdp.send('Page.getFrameTree');
    for (const frame of findTreeFrames(frameTree)) {
      // Chromium assigns a new frame id when Codex rebuilds the content area,
      // even if the existing iframe element keeps the same name.
      const key = `${target.id}:${frame.id}`;
      if (loadedFrames.has(key)) continue;
      await cdp.send('Page.setDocumentContent', { frameId: frame.id, html: await treeDocument() });
      loadedFrames.add(key);
    }
  } finally {
    cdp.close();
  }
}

async function main() {
  if (process.argv.includes('--preflight')) {
    let cdpReachable = false;
    try { cdpReachable = (await targets()).length > 0; } catch {}
    process.stdout.write(`${JSON.stringify({
      ok: true,
      codexExecutable: codexExecutable(),
      runningMainProcessIds: mainCodexProcesses(),
      cdpReachable,
      treeDatabase: path.join(process.env.CODEX_HOME || path.join(process.env.USERPROFILE, '.codex'), 'state_5.sqlite'),
      usesIndependentProfile: false,
    }, null, 2)}\n`);
    return;
  }
  const singleton = await acquireSingleton();
  if (!singleton) return;
  await ensureTreeServer();

  let debuggable = false;
  try { debuggable = (await targets()).length > 0; } catch {}
  if (!debuggable) {
    await closeRunningCodex();
    launchMainProfileCodex();
  }

  const injected = new Set();
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      for (const target of await targets()) {
        if (!injected.has(target.id)) {
          await inject(target);
          injected.add(target.id);
        }
      }
      if (injected.size) break;
    } catch {}
    await sleep(250);
  }
  if (!injected.size) throw new Error('未能连接到主窗口 Codex。可双击“恢复官方Codex”立即回退。');

  let emptyPolls = 0;
  while (true) {
    try {
      const liveTargets = await targets();
      if (!liveTargets.length) {
        emptyPolls += 1;
        if (emptyPolls >= 20) break;
      } else {
        emptyPolls = 0;
      }
      for (const target of liveTargets) {
        if (!injected.has(target.id)) {
          await inject(target);
          injected.add(target.id);
        }
        await loadFrames(target);
      }
    } catch {
      emptyPolls += 1;
      if (emptyPolls >= 20) break;
    }
    await sleep(500);
  }
  singleton.close();
}

main().catch((error) => {
  const message = JSON.stringify(String(error.message || error));
  powershell(`Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(${message}, 'Codex 会话树')`);
  process.exit(1);
});
