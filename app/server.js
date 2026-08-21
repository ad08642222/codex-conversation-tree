const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { DatabaseSync } = require('node:sqlite');

const HOST = '127.0.0.1';
const PORT = Number(process.env.CODEX_TREE_PORT || 47831);
const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_PATH = path.join(CODEX_HOME, 'state_5.sqlite');
const OWNER_PID = Number(process.env.CODEX_TREE_OWNER_PID || 0);

let cachedTree = null;
let cachedAt = 0;

function walkJsonl(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonl(full, output);
    else if (entry.isFile() && entry.name.endsWith('.jsonl')) output.push(full);
  }
  return output;
}

function readSessionMeta(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const buffer = Buffer.alloc(256 * 1024);
    const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
    const line = buffer.toString('utf8', 0, bytes).split(/\r?\n/, 1)[0];
    const parsed = JSON.parse(line);
    if (parsed.type !== 'session_meta') return null;
    const p = parsed.payload || {};
    return {
      id: p.id || p.session_id,
      parentId: p.forked_from_id || null,
      cliVersion: p.cli_version || '',
      originator: p.originator || '',
      threadSource: p.thread_source || '',
      rolloutPath: file,
    };
  } catch {
    return null;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

function readDatabase() {
  const threads = new Map();
  const spawnEdges = [];
  if (!fs.existsSync(DB_PATH)) return { threads, spawnEdges };
  const db = new DatabaseSync(DB_PATH, { readOnly: true });
  try {
    const threadColumns = new Set(db.prepare('PRAGMA table_info(threads)').all().map((column) => column.name));
    const nameColumn = threadColumns.has('name') ? 'name' : 'NULL AS name';
    const rows = db.prepare(`
      SELECT id, ${nameColumn}, title, created_at, updated_at, archived, cwd, source,
             first_user_message, preview, is_pinned, thread_source
      FROM threads
    `).all();
    for (const row of rows) threads.set(row.id, row);
    try {
      for (const edge of db.prepare('SELECT parent_thread_id, child_thread_id FROM thread_spawn_edges').all()) {
        spawnEdges.push(edge);
      }
    } catch { /* Older Codex databases may not contain this table. */ }
  } finally {
    db.close();
  }
  return { threads, spawnEdges };
}

function buildTreeData() {
  const { threads, spawnEdges } = readDatabase();
  const metas = new Map();
  const sessionRoots = [path.join(CODEX_HOME, 'sessions'), path.join(CODEX_HOME, 'archived_sessions')];
  for (const root of sessionRoots) {
    for (const file of walkJsonl(root)) {
      const meta = readSessionMeta(file);
      if (meta?.id) metas.set(meta.id, meta);
    }
  }

  for (const edge of spawnEdges) {
    const child = metas.get(edge.child_thread_id) || { id: edge.child_thread_id };
    if (!child.parentId) child.parentId = edge.parent_thread_id;
    metas.set(child.id, child);
  }

  const ids = new Set([...threads.keys(), ...metas.keys()]);
  const nodes = [];
  for (const id of ids) {
    const row = threads.get(id) || {};
    const meta = metas.get(id) || {};
    const customName = String(row.name || '').replace(/\s+/g, ' ').trim();
    const originalTitle = String(row.title || row.first_user_message || '').replace(/\s+/g, ' ').trim();
    const title = customName || originalTitle || '未命名会话';
    nodes.push({
      id,
      parentId: meta.parentId && ids.has(meta.parentId) ? meta.parentId : null,
      missingParentId: meta.parentId && !ids.has(meta.parentId) ? meta.parentId : null,
      title: title || '未命名会话',
      customName: customName || null,
      originalTitle: originalTitle || null,
      createdAt: Number(row.created_at || 0) * 1000,
      updatedAt: Number(row.updated_at || 0) * 1000,
      archived: Boolean(row.archived),
      pinned: Boolean(row.is_pinned),
      cwd: String(row.cwd || '').replace(/^\\\\\?\\/, ''),
      source: row.source || meta.originator || '',
      threadSource: row.thread_source || meta.threadSource || '',
      preview: String(row.preview || row.first_user_message || '').replace(/\s+/g, ' ').trim().slice(0, 360),
      cliVersion: meta.cliVersion || '',
      openUrl: `codex://threads/${encodeURIComponent(id)}`,
    });
  }
  nodes.sort((a, b) => b.updatedAt - a.updatedAt);
  return {
    generatedAt: Date.now(),
    codexHome: CODEX_HOME,
    count: nodes.length,
    branchCount: nodes.filter((n) => n.parentId).length,
    nodes,
  };
}

function getTreeData(force = false) {
  if (!force && cachedTree && Date.now() - cachedAt < 1500) return cachedTree;
  cachedTree = buildTreeData();
  cachedAt = Date.now();
  return cachedTree;
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function serveFile(res, file, type) {
  fs.readFile(file, (error, data) => {
    if (error) return sendJson(res, 404, { error: 'Not found' });
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': data.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/api/tree') {
    try { return sendJson(res, 200, getTreeData(url.searchParams.get('refresh') === '1')); }
    catch (error) { return sendJson(res, 500, { error: error.message }); }
  }
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, mode: 'read-only', codexHome: CODEX_HOME, database: DB_PATH });
  }
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return serveFile(res, path.join(PUBLIC_DIR, 'index.html'), 'text/html; charset=utf-8');
  }
  return sendJson(res, 404, { error: 'Not found' });
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    execFile('cmd.exe', ['/c', 'start', '', `http://${HOST}:${PORT}`], { windowsHide: true });
    process.exit(0);
  }
  console.error(error);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const address = `http://${HOST}:${PORT}`;
  console.log(`Codex Conversation Tree: ${address}`);
  if (process.env.CODEX_TREE_EMBEDDED !== '1') {
    setTimeout(() => execFile('cmd.exe', ['/c', 'start', '', address], { windowsHide: true }), 250);
  }
});

if (OWNER_PID > 0) {
  const ownerWatch = setInterval(() => {
    try {
      process.kill(OWNER_PID, 0);
    } catch {
      clearInterval(ownerWatch);
      server.close(() => process.exit(0));
    }
  }, 2000);
  ownerWatch.unref();
}
