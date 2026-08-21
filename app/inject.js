(() => {
  'use strict';
  const VERSION = '1.1.1-main-profile';
  const SENTINEL = '__codexConversationTreeInjection__';
  const ENTRY_ID = 'codex-conversation-tree-entry';
  const PAGE_ID = 'codex-conversation-tree-page';
  const STYLE_ID = 'codex-conversation-tree-style';
  const HIDDEN = 'data-codex-tree-native-hidden';
  const HOST = 'data-codex-tree-page-host';
  const TREE_URL = 'http://127.0.0.1:47831/?embedded=1';
  const labels = ['插件', 'plugins'];

  if (window[SENTINEL]?.version === VERSION) {
    window[SENTINEL].refresh();
    return;
  }
  try { window[SENTINEL]?.destroy?.(); } catch {}
  document.querySelectorAll(`#${ENTRY_ID},#${PAGE_ID}`).forEach((node) => node.remove());

  let entry = null;
  let page = null;
  let active = false;
  let observer = null;
  let timer = null;

  const norm = (v) => String(v || '').replace(/\s+/g, ' ').trim().toLowerCase();

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${ENTRY_ID}[aria-current="page"]{background:var(--color-token-list-hover-background,color-mix(in srgb,currentColor 8%,transparent));color:var(--color-token-foreground,inherit)}
      #${ENTRY_ID}:focus-visible{outline:2px solid var(--color-token-border,Highlight);outline-offset:2px}
      [${HOST}="true"]{position:relative!important;z-index:31!important;pointer-events:none!important}
      [${HIDDEN}="true"]{visibility:hidden!important;pointer-events:none!important}
      #${PAGE_ID}{position:absolute;inset:0;z-index:50;overflow:hidden;background:#0b0c10;pointer-events:auto}
      #${PAGE_ID}[hidden]{display:none!important}
      #${PAGE_ID} iframe{display:block;width:100%;height:100%;border:0;background:#0b0c10}
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function referenceButton() {
    const scroll = document.querySelector('[data-app-action-sidebar-scroll]');
    if (!scroll) return null;
    const buttons = [...scroll.querySelectorAll('button')];
    const plugins = buttons.find((b) => labels.includes(norm(b.textContent || b.ariaLabel)));
    if (plugins?.parentElement) return plugins;
    const firstSection = scroll.querySelector('[data-app-action-sidebar-section]');
    const top = firstSection?.getBoundingClientRect().top ?? Infinity;
    const groups = [...scroll.querySelectorAll('div')].filter((e) => [...e.children].filter((c) => c.tagName === 'BUTTON').length >= 3 && e.getBoundingClientRect().top < top);
    const group = groups.sort((a,b) => b.children.length-a.children.length)[0];
    return [...(group?.children || [])].filter((c) => c.tagName === 'BUTTON').at(-1) || null;
  }

  function treeIcon(button) {
    const svg = button.querySelector('svg');
    if (!svg) return;
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.8');
    svg.setAttribute('stroke-linecap','round');
    svg.setAttribute('stroke-linejoin','round');
    svg.innerHTML = '<circle cx="5" cy="5" r="2.2"/><circle cx="18" cy="9" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M7.2 5h3.2a3 3 0 0 1 3 3v7a3 3 0 0 0 3 3M13.4 9H16"/>';
  }

  function createEntry(ref) {
    const b = ref.cloneNode(true);
    b.id = ENTRY_ID;
    b.type = 'button';
    ['disabled','aria-expanded','aria-controls','aria-describedby','data-state'].forEach((a) => b.removeAttribute(a));
    b.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    const label = b.querySelector('.text-fade-truncate') || [...b.querySelectorAll('span')].find((n) => labels.includes(norm(n.textContent)));
    if (label) label.textContent = '会话树'; else b.textContent = '会话树';
    b.setAttribute('aria-label','打开会话树');
    b.setAttribute('title','会话树');
    treeIcon(b);
    b.addEventListener('click',(e) => { e.preventDefault(); e.stopPropagation(); openTree(); });
    return b;
  }

  function ensureEntry() {
    installStyles();
    const ref = referenceButton();
    if (!ref?.parentElement) return;
    if (!entry) entry = createEntry(ref);
    if (entry.parentElement !== ref.parentElement || entry.previousElementSibling !== ref) ref.after(entry);
    if (active) entry.setAttribute('aria-current','page'); else entry.removeAttribute('aria-current');
  }

  function findMount() {
    const frameHost = document.querySelector('.app-shell-main-content-frame');
    const viewport = frameHost?.closest?.('[data-app-shell-main-content-layout]') || document.querySelector('[data-app-shell-main-content-layout]');
    const surface = viewport?.parentElement;
    return surface?.closest('main') ? surface : null;
  }

  function ensurePage() {
    if (page) return page;
    page = document.createElement('section');
    page.id = PAGE_ID;
    page.hidden = true;
    page.setAttribute('role','region');
    page.setAttribute('aria-label','Codex 会话树');
    const frame = document.createElement('iframe');
    frame.name = `codex-tree-${crypto.randomUUID()}`;
    frame.src = 'about:blank';
    frame.title = 'Codex 会话树';
    frame.referrerPolicy = 'no-referrer';
    frame.setAttribute('sandbox','allow-scripts allow-forms allow-modals allow-downloads');
    frame.setAttribute('allow','clipboard-read; clipboard-write');
    page.appendChild(frame);
    return page;
  }

  function restore() {
    document.querySelectorAll(`[${HIDDEN}="true"]`).forEach((n) => n.removeAttribute(HIDDEN));
    document.querySelectorAll(`[${HOST}="true"]`).forEach((n) => n.removeAttribute(HOST));
  }

  function mountPage() {
    if (!active) return;
    const surface = findMount();
    if (!surface) return;
    const p = ensurePage();
    if (p.parentElement !== surface) { restore(); surface.appendChild(p); }
    surface.setAttribute(HOST,'true');
    [...surface.children].forEach((child) => { if (child !== p) child.setAttribute(HIDDEN,'true'); });
    document.querySelectorAll('[data-testid="app-shell-header-context-menu-surface"]').forEach((s) => [...s.children].forEach((c) => c.setAttribute(HIDDEN,'true')));
    p.hidden = false;
  }

  function openTree() {
    active = true;
    ensureEntry();
    mountPage();
    entry?.setAttribute('aria-current','page');
  }

  function closeTree() {
    if (!active) return;
    active = false;
    if (page) page.hidden = true;
    restore();
    entry?.removeAttribute('aria-current');
  }

  function nativeNavigation(target) {
    const clickable = target?.closest?.('button,a,[role="button"],[data-app-action-sidebar-thread-id]');
    if (!clickable || clickable === entry || clickable.closest(`#${ENTRY_ID}`)) return false;
    if (!clickable.closest('aside nav[role="navigation"]')) return false;
    return !clickable.hasAttribute('data-app-action-sidebar-section-toggle');
  }

  function onClick(e) { if (active && nativeNavigation(e.target)) closeTree(); }
  function onMessage(e) {
    if (e.source !== page?.querySelector('iframe')?.contentWindow) return;
    if (e.data?.type !== 'codex-tree:open-thread' || typeof e.data.threadId !== 'string') return;
    const id = e.data.threadId.trim();
    if (!/^[0-9a-z-]{16,80}$/i.test(id)) return;
    closeTree();
    const row = [...document.querySelectorAll('[data-app-action-sidebar-thread-id]')].find((n) => n.getAttribute('data-app-action-sidebar-thread-id')?.replace(/^(local|cloud):/i,'') === id);
    if (row) row.click();
    else window.postMessage({type:'navigate-to-route',path:`/local/${encodeURIComponent(id)}`},window.location.origin);
  }

  function refresh() { ensureEntry(); mountPage(); }
  function schedule() { if (timer) return; timer=setTimeout(()=>{timer=null;refresh()},160); }
  function destroy() { active=false; observer?.disconnect(); document.removeEventListener('click',onClick,true); window.removeEventListener('message',onMessage); page?.remove(); entry?.remove(); restore(); document.getElementById(STYLE_ID)?.remove(); }

  function mount() {
    ensureEntry();
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-label','aria-current','data-theme']});
    document.addEventListener('click',onClick,true);
    window.addEventListener('message',onMessage);
  }
  window[SENTINEL] = { version: VERSION, refresh, open: openTree, close: closeTree, destroy };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',mount,{once:true}); else mount();
})();
