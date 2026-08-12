const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');

const APP_DIR = __dirname;
const PORT = 9239;
const TREE_PORT = 47831;
const CONTROL_PORT = 9240;
const PROFILE = path.join(APP_DIR, 'CodexProfile');
const INJECT_SOURCE = fs.readFileSync(path.join(APP_DIR, 'inject.js'), 'utf8');
const loadedFrames = new Set();

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function reachable(url) { try { return (await fetch(url,{signal:AbortSignal.timeout(800)})).ok; } catch { return false; } }

function codexExecutable() {
  const command = '(Get-AppxPackage OpenAI.Codex).InstallLocation';
  const found = spawnSync('powershell.exe',['-NoProfile','-Command',command],{encoding:'utf8',windowsHide:true}).stdout.trim();
  const exe = path.join(found,'app','ChatGPT.exe');
  if (!found || !fs.existsSync(exe)) throw new Error('找不到已安装的 Codex Windows 应用');
  return exe;
}

async function ensureTreeServer() {
  if (await reachable(`http://127.0.0.1:${TREE_PORT}/api/health`)) return;
  const child = spawn(process.execPath,['--no-warnings',path.join(APP_DIR,'server.js')],{
    cwd:APP_DIR,detached:true,stdio:'ignore',windowsHide:true,
    env:{...process.env,CODEX_TREE_EMBEDDED:'1'}
  });
  child.unref();
  for(let i=0;i<40;i++){ if(await reachable(`http://127.0.0.1:${TREE_PORT}/api/health`))return; await sleep(150); }
  throw new Error('会话树服务未能启动');
}

function launchCodex() {
  fs.mkdirSync(PROFILE,{recursive:true});
  const child=spawn(codexExecutable(),[
    `--user-data-dir=${PROFILE}`,
    '--remote-debugging-address=127.0.0.1',
    `--remote-debugging-port=${PORT}`,
    `--remote-allow-origins=http://127.0.0.1:${PORT}`,
  ],{detached:true,stdio:'ignore',windowsHide:false});
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
  constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map()}
  open(){return new Promise((resolve,reject)=>{this.ws.addEventListener('open',resolve,{once:true});this.ws.addEventListener('error',reject,{once:true});this.ws.addEventListener('message',(e)=>{const m=JSON.parse(e.data);if(m.id&&this.pending.has(m.id)){const {resolve,reject}=this.pending.get(m.id);this.pending.delete(m.id);m.error?reject(Error(m.error.message)):resolve(m.result)}})})}
  send(method,params={}){const id=++this.id;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params}))})}
  close(){this.ws.close()}
}

async function targets(){
  const r=await fetch(`http://127.0.0.1:${PORT}/json/list`,{signal:AbortSignal.timeout(1200)});
  return (await r.json()).filter(t=>t.type==='page'&&(t.url?.startsWith('app://')||t.title==='Codex'));
}

async function inject(target){
  const c=new Cdp(target.webSocketDebuggerUrl);await c.open();
  try{
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    await c.send('Page.setBypassCSP',{enabled:true});
    await c.send('Page.addScriptToEvaluateOnNewDocument',{source:INJECT_SOURCE});
    const result=await c.send('Runtime.evaluate',{expression:INJECT_SOURCE,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw Error(result.exceptionDetails.text||'注入失败');
  }finally{c.close()}
}

function findTreeFrames(node, output=[]){
  if(node?.frame?.name?.startsWith('codex-tree-'))output.push(node.frame);
  for(const child of node?.childFrames||[])findTreeFrames(child,output);
  return output;
}

async function treeDocument(){
  const response=await fetch(`http://127.0.0.1:${TREE_PORT}/?embedded=1`,{signal:AbortSignal.timeout(1500)});
  if(!response.ok)throw Error(`会话树页面 HTTP ${response.status}`);
  const html=await response.text();
  return html.replace('<head>',`<head><base href="http://127.0.0.1:${TREE_PORT}/">`);
}

async function loadFrames(target){
  const c=new Cdp(target.webSocketDebuggerUrl);await c.open();
  try{
    await c.send('Page.enable');
    await c.send('Page.setBypassCSP',{enabled:true});
    const {frameTree}=await c.send('Page.getFrameTree');
    for(const frame of findTreeFrames(frameTree)){
      const key=`${target.id}:${frame.name}`;
      if(loadedFrames.has(key))continue;
      await c.send('Page.setDocumentContent',{frameId:frame.id,html:await treeDocument()});
      loadedFrames.add(key);
    }
  }finally{c.close()}
}

async function main(){
  const singleton=await acquireSingleton();
  if(!singleton){
    launchCodex();
    return;
  }
  await ensureTreeServer();
  let existing=false;try{existing=(await targets()).length>0}catch{}
  if(!existing)launchCodex();
  const injected=new Set();
  for(let wait=0;wait<120;wait++){
    try{
      for(const target of await targets()){
        if(injected.has(target.id))continue;
        await inject(target);injected.add(target.id);
      }
      if(injected.size)break;
    }catch{}
    await sleep(250);
  }
  if(!injected.size)throw Error('未能连接到内嵌版 Codex');
  let emptyPolls=0;
  while(true){
    try{
      const liveTargets=await targets();
      if(liveTargets.length===0){emptyPolls+=1;if(emptyPolls>=20)break}
      else emptyPolls=0;
      for(const target of liveTargets){if(!injected.has(target.id)){await inject(target);injected.add(target.id)}await loadFrames(target)}
    }catch{emptyPolls+=1;if(emptyPolls>=20)break}
    await sleep(500);
  }
  singleton.close();
}

main().catch((e)=>{
  spawnSync('powershell.exe',['-NoProfile','-Command',`Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show(${JSON.stringify(e.message)}, 'Codex 会话树')`],{windowsHide:true});
  process.exit(1);
});
