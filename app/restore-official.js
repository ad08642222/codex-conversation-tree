const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const APP_DIR = __dirname;

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function powershell(script) {
  return spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

function mainCodexProcesses() {
  const script = [
    "Get-CimInstance Win32_Process -Filter \"Name='ChatGPT.exe'\"",
    "| Where-Object { $_.CommandLine -notmatch '--type=' }",
    "| Select-Object -ExpandProperty ProcessId",
  ].join(' ');
  return powershell(script).stdout.split(/\r?\n/).map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

function helperProcessIds() {
  const escapedDirectory = APP_DIR.replace(/'/g, "''");
  const script = [
    "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\"",
    `| Where-Object { $_.CommandLine -like '*${escapedDirectory}*' -and ($_.CommandLine -like '*embedded-launcher.js*' -or $_.CommandLine -like '*server.js*') }`,
    '| Select-Object -ExpandProperty ProcessId',
  ].join(' ');
  return powershell(script).stdout.split(/\r?\n/).map(Number).filter((id) => Number.isInteger(id) && id > 0);
}

async function main() {
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify({
      ok: true,
      runningMainProcessIds: mainCodexProcesses(),
      helperProcessIds: helperProcessIds(),
      officialAppId: 'OpenAI.Codex_2p2nqsd0c76g0!App',
      appDirectory: path.resolve(APP_DIR),
    }, null, 2)}\n`);
    return;
  }
  const ids = mainCodexProcesses();
  if (ids.length) {
    const script = `$ids = @(${ids.join(',')}); foreach ($id in $ids) { $p = Get-Process -Id $id -ErrorAction SilentlyContinue; if ($p) { [void]$p.CloseMainWindow() } }`;
    powershell(script);
    for (let attempt = 0; attempt < 40 && mainCodexProcesses().length; attempt += 1) await sleep(250);
    if (mainCodexProcesses().length) {
      for (const id of ids) {
        spawnSync('taskkill.exe', ['/PID', String(id), '/F'], { windowsHide: true, stdio: 'ignore' });
      }
      for (let attempt = 0; attempt < 40 && mainCodexProcesses().length; attempt += 1) await sleep(250);
    }
  }
  if (mainCodexProcesses().length) throw new Error('请先正常关闭 Codex，再重新运行恢复程序。');
  for (const id of helperProcessIds()) {
    spawnSync('taskkill.exe', ['/PID', String(id), '/F'], { windowsHide: true, stdio: 'ignore' });
  }
  const child = spawn('explorer.exe', ['shell:AppsFolder\\OpenAI.Codex_2p2nqsd0c76g0!App'], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  });
  child.unref();
}

main().catch((error) => {
  const message = JSON.stringify(String(error.message || error));
  powershell(`Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(${message}, '恢复官方 Codex')`);
  process.exit(1);
});
