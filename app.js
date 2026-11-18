// SJscanner web app — everything stays on the device (IndexedDB).
'use strict';

/* ================= icons ================= */
const ICONS = {
  camera: '<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.6l1.2-1.8A1.5 1.5 0 0 1 10.6 3.5h2.8a1.5 1.5 0 0 1 1.3.7L15.9 6h1.6A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-4.8-4.8a1.2 1.2 0 0 0-1.7 0L6 19.5"/>',
  back: '<path d="M9 5l7 7-7 7"/>',
  more: '<circle cx="12" cy="5.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="18.5" r="1.3" fill="currentColor"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.5"/>',
  crop: '<path d="M6 2.5V16a2 2 0 0 0 2 2h13.5"/><path d="M2.5 6H16a2 2 0 0 1 2 2v13.5"/>',
  text: '<path d="M4 7V5.5A1.5 1.5 0 0 1 5.5 4H7M17 4h1.5A1.5 1.5 0 0 1 20 5.5V7M20 17v1.5a1.5 1.5 0 0 1-1.5 1.5H17M7 20H5.5A1.5 1.5 0 0 1 4 18.5V17"/><path d="M8.5 8.5h7M12 8.5v7"/>',
  reorder: '<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/>',
  trash: '<path d="M4.5 6.5h15M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6.5 6.5l.8 12.2a2 2 0 0 0 2 1.8h5.4a2 2 0 0 0 2-1.8l.8-12.2"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M8.5 10.5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1.5"/>',
  download: '<path d="M12 3.5v11M8 10.5l4 4 4-4"/><path d="M4.5 15.5v2a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  filter: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M12 3.5a8.5 8.5 0 0 1 0 17" fill="currentColor"/>',
  doc: '<path d="M7 3.5h7l5 5V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M14 3.5V8.5h5"/>',
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}
function paintIcons(root = document) {
  root.querySelectorAll('i.ico[data-i]').forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.i); });
}

/* ================= helpers ================= */
const $ = (id) => document.getElementById(id);
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const two = (v) => String(v).padStart(2, '0');
const fmtDate = (ms) => { const d = new Date(ms); return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const defaultName = () => { const d = new Date(); return `مستند ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${two(d.getHours())}:${two(d.getMinutes())}`; };
function pagesWord(n) {
  if (n === 1) return 'صفحة واحدة';
  if (n === 2) return 'صفحتان';
  if (n >= 3 && n <= 10) return `${n} صفحات`;
  return `${n} صفحة`;
}
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeFile = (s) => (s || 'SJscanner').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'SJscanner';

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2600);
}
function busy(text) {
  if (text === false) { $('busy').classList.add('hidden'); return; }
  $('busyText').textContent = text;
  $('busy').classList.remove('hidden');
}

/* ================= storage (IndexedDB) ================= */
const DB = (() => {
  let dbp;
  function open() {
    if (!dbp) {
      dbp = new Promise((res, rej) => {
        const r = indexedDB.open('sjscanner', 1);
        r.onupgradeneeded = () => {
          const db = r.result;
          db.createObjectStore('docs', { keyPath: 'id' });
          db.createObjectStore('blobs');
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return dbp;
  }
  async function tx(store, mode, fn) {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const s = t.objectStore(store);
      let out;
      const r = fn(s);
      if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  }
  return {
    allDocs: () => tx('docs', 'readonly', (s) => s.getAll()),
    putDoc: (d) => tx('docs', 'readwrite', (s) => s.put(d)),
    delDoc: (id) => tx('docs', 'readwrite', (s) => s.delete(id)),
    getBlob: (k) => tx('blobs', 'readonly', (s) => s.get(k)),
    putBlob: (k, b) => tx('blobs', 'readwrite', (s) => s.put(b, k)),
    delBlob: (k) => tx('blobs', 'readwrite', (s) => s.delete(k)),
  };
})();

// Some older iOS versions can't store Blobs in IndexedDB; fall back to ArrayBuffer.
async function saveBlob(key, blob) {
  try { await DB.putBlob(key, blob); }
  catch (e) { await DB.putBlob(key, { buf: await blob.arrayBuffer(), type: blob.type }); }
}
async function loadBlob(key) {
  const v = await DB.getBlob(key);
  if (!v) return null;
  if (v instanceof Blob) return v;
  if (v.buf) return new Blob([v.buf], { type: v.type || 'image/jpeg' });
  return null;
}

/* ================= worker ================= */
const worker = new Worker('worker.js?v=1');
let wSeq = 0;
const wJobs = new Map();
worker.onmessage = (e) => {
  const j = wJobs.get(e.data.id);
  if (!j) return;
  wJobs.delete(e.data.id);
  e.data.error ? j.rej(new Error(e.data.error)) : j.res(e.data.result);
};
function work(msg, transfer) {
  return new Promise((res, rej) => {
    const id = ++wSeq;
    wJobs.set(id, { res, rej });
    worker.postMessage({ ...msg, id }, transfer || []);
  });
}

/* ================= image helpers ================= */
async function decodeImage(blob) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch (e) { /* fall through */ }
    try { return await createImageBitmap(blob); } catch (e) { /* fall through */ }
  }
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const im = new Image();
    im.onload = () => { res(im); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('decode')); };
    im.src = url;
  });
}
function canvasToBlob(c, q) {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', q));
}
function freeCanvas(c) { c.width = 0; c.height = 0; }

const MAX_ORIG = 2400;
const MAX_OUT = 2000;

// Downsizes the picked photo, stores it as the page original and finds the paper.
async function prepareOriginal(file) {
  const bmp = await decodeImage(file);
  const iw = bmp.width || bmp.naturalWidth, ih = bmp.height || bmp.naturalHeight;
  const k = Math.min(1, MAX_ORIG / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * k)), h = Math.max(1, Math.round(ih * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  const blob = await canvasToBlob(c, 0.92);
  const px = ctx.getImageData(0, 0, w, h);
  freeCanvas(c);
  const det = await work({ op: 'detect', data: px.data.buffer, w, h }, [px.data.buffer]);
  return { blob, w, h, quad: det.quad };
}

// Warp + filter + rotation from the stored original. Returns the processed JPEG.
async function renderPageBlob(page) {
  const orig = await loadBlob('o:' + page.id);
  if (!orig) throw new Error('missing original');
  const bmp = await decodeImage(orig);
  const w = bmp.width || bmp.naturalWidth, h = bmp.height || bmp.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  if (bmp.close) bmp.close();
  const px = ctx.getImageData(0, 0, w, h);
  freeCanvas(c);
  // quad is stored in original-image coordinates (page.w × page.h)
  const sx = w / page.w, sy = h / page.h;
  const quad = page.quad.map((v, i) => v * (i % 2 ? sy : sx));
  const r = await work({ op: 'render', data: px.data.buffer, w, h, quad, filter: page.filter, maxOut: MAX_OUT }, [px.data.buffer]);
  const oc = document.createElement('canvas');
  oc.width = r.w; oc.height = r.h;
  oc.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(r.data), r.w, r.h), 0, 0);
  let out = oc;
  const rot = ((page.rotation || 0) % 360 + 360) % 360;
  if (rot) {
    out = document.createElement('canvas');
    const swap = rot === 90 || rot === 270;
    out.width = swap ? r.h : r.w; out.height = swap ? r.w : r.h;
    const o = out.getContext('2d');
    o.translate(out.width / 2, out.height / 2);
    o.rotate(rot * Math.PI / 180);
    o.drawImage(oc, -r.w / 2, -r.h / 2);
    freeCanvas(oc);
  }
  const blob = await canvasToBlob(out, 0.86);
  const res = { blob, pw: out.width, ph: out.height };
  freeCanvas(out);
  return res;
}

/* ================= object URLs ================= */
const urlCache = new Map(); // key -> {url, v}
async function pageUrl(page) {
  const key = 'p:' + page.id;
  const c = urlCache.get(key);
  if (c && c.v === page.v) return c.url;
  const b = await loadBlob(key);
  if (!b) return '';
  if (c) URL.revokeObjectURL(c.url);
  const url = URL.createObjectURL(b);
  urlCache.set(key, { url, v: page.v });
  return url;
}

/* ================= state ================= */
let docs = [];
let cur = null;      // open document
let curIdx = 0;      // current page index
let addTarget = null; // null = new document, otherwise doc id

async function loadDocs() {
  docs = (await DB.allDocs()) || [];
  docs.sort((a, b) => b.updated - a.updated);
}
async function saveDoc(d) {
  d.updated = Date.now();
  await DB.putDoc(d);
}

/* ================= views ================= */
function show(view) {
  ['home', 'doc', 'crop'].forEach((v) => $(v).classList.toggle('hidden', v !== view));
}

window.addEventListener('popstate', () => {
  closeSheet(true);
  if (!$('crop').classList.contains('hidden')) { closeCrop(); show('doc'); return; }
  if (!$('doc').classList.contains('hidden')) { cur = null; show('home'); renderHome(); }
});
function pushNav() { history.pushState({ n: Date.now() }, ''); }

/* ---------- home ---------- */
async function renderHome() {
  const q = $('search').value.trim();
  const list = q ? docs.filter((d) => d.name.includes(q)) : docs;
  $('empty').classList.toggle('hidden', docs.length > 0);
  $('searchWrap').classList.toggle('hidden', docs.length === 0);
  $('listTitle').classList.toggle('hidden', docs.length === 0);
  $('noResults').classList.toggle('hidden', !(docs.length && !list.length));
  const box = $('docList');
  box.innerHTML = list.map((d) => `
    <div class="doc-item" data-id="${d.id}" role="button">
      <img class="doc-thumb" alt="">
      <div class="doc-info"><b>${esc(d.name)}</b><span>${pagesWord(d.pages.length)} · ${fmtDate(d.updated)}</span></div>
      <button class="icon-btn" data-more="${d.id}" aria-label="المزيد">${icon('more')}</button>
    </div>`).join('');
  for (const d of list) {
    const el = box.querySelector(`[data-id="${d.id}"] img`);
    if (el && d.pages[0]) pageUrl(d.pages[0]).then((u) => { if (u) el.src = u; });
  }
}

$('docList').addEventListener('click', (e) => {
  const more = e.target.closest('[data-more]');
  if (more) { e.stopPropagation(); docMenu(docs.find((d) => d.id === more.dataset.more), true); return; }
  const item = e.target.closest('.doc-item');
  if (item) openDoc(item.dataset.id);
});
$('search').addEventListener('input', renderHome);
$('homeCamera').onclick = () => pick('cam', null);
$('homeGallery').onclick = () => pick('gal', null);

/* ---------- picking images ---------- */
function pick(kind, docId) {
  addTarget = docId;
  const inp = kind === 'cam' ? $('camIn') : $('galIn');
  inp.value = '';
  inp.click();
}
$('camIn').onchange = (e) => addFiles([...e.target.files]);
$('galIn').onchange = (e) => addFiles([...e.target.files]);

async function addFiles(files) {
  files = files.filter((f) => f && (f.type.startsWith('image/') || /\.(jpe?g|png|heic|heif|webp)$/i.test(f.name)));
  if (!files.length) return;
  let doc = addTarget ? docs.find((d) => d.id === addTarget) : null;
  const isNew = !doc;
  if (isNew) doc = { id: newId(), name: defaultName(), created: Date.now(), updated: Date.now(), pages: [] };
  const filter = doc.pages.length ? doc.pages[doc.pages.length - 1].filter : 'enh';
  let ok = 0;
  for (let i = 0; i < files.length; i++) {
    busy(files.length > 1 ? `جارٍ تجهيز الصفحة ${i + 1} من ${files.length}…` : 'جارٍ تجهيز الصفحة…');
    try {
      const pr = await prepareOriginal(files[i]);
      const page = { id: newId(), w: pr.w, h: pr.h, quad: pr.quad, autoQuad: pr.quad.slice(), filter, rotation: 0, v: 1 };
      await saveBlob('o:' + page.id, pr.blob);
      const r = await renderPageBlob(page);
      await saveBlob('p:' + page.id, r.blob);
      page.pw = r.pw; page.ph = r.ph;
      doc.pages.push(page);
      ok++;
    } catch (err) {
      console.error(err);
    }
  }
  busy(false);
  if (!ok) { toast('تعذّرت معالجة الصور، جرّب صورة أخرى'); return; }
  await saveDoc(doc);
  if (isNew) docs.unshift(doc);
  await loadDocs();
  if (isNew) {
    await openDoc(doc.id);
  } else {
    cur = docs.find((d) => d.id === doc.id);
    await renderDoc(cur.pages.length - 1);
    toast(ok === 1 ? 'أُضيفت صفحة جديدة' : `أُضيفت ${pagesWord(ok)}`);
  }
  if (ok < files.length) toast('تعذّرت معالجة بعض الصور');
}

/* ---------- document ---------- */
async function openDoc(id) {
  cur = docs.find((d) => d.id === id);
  if (!cur) return;
  show('doc');
  pushNav();
  await renderDoc(0);
}

let io;
async function renderDoc(goto) {
  if (!cur) return;
  $('docName').textContent = cur.name;
  const pager = $('pager');
  pager.innerHTML = cur.pages.map((p, i) => `
    <div class="pg" data-i="${i}"><img alt="صفحة ${i + 1}"><div class="spinner pg-spin"></div></div>`).join('');
  cur.pages.forEach((p, i) => {
    const img = pager.querySelector(`.pg[data-i="${i}"] img`);
    pageUrl(p).then((u) => { if (u) img.src = u; });
  });
  if (io) io.disconnect();
  io = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting && en.intersectionRatio > 0.55) { curIdx = +en.target.dataset.i; updateDocUi(); }
  }, { root: pager, threshold: [0.6] });
  pager.querySelectorAll('.pg').forEach((el) => io.observe(el));
  curIdx = Math.max(0, Math.min(goto || 0, cur.pages.length - 1));
  requestAnimationFrame(() => scrollToPage(curIdx, false));
  updateDocUi();
}
function scrollToPage(i, smooth) {
  const el = $('pager').querySelector(`.pg[data-i="${i}"]`);
  if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'center', block: 'nearest' });
}
function updateDocUi() {
  if (!cur) return;
  $('pageInd').textContent = `${curIdx + 1} / ${cur.pages.length}`;
  const p = cur.pages[curIdx];
  $('filters').querySelectorAll('button').forEach((b) => b.classList.toggle('on', p && b.dataset.f === p.filter));
}
function setLoading(i, on) {
  const el = $('pager').querySelector(`.pg[data-i="${i}"]`);
  if (el) el.classList.toggle('loading', on);
}
async function rerender(i) {
  const p = cur.pages[i];
  setLoading(i, true);
  try {
    const r = await renderPageBlob(p);
    await saveBlob('p:' + p.id, r.blob);
    p.pw = r.pw; p.ph = r.ph; p.v = (p.v || 1) + 1;
    await saveDoc(cur);
    const u = await pageUrl(p);
    const img = $('pager').querySelector(`.pg[data-i="${i}"] img`);
    if (img) img.src = u;
  } catch (e) {
    console.error(e);
    toast('تعذّرت معالجة الصفحة');
  }
  setLoading(i, false);
}

$('docBack').onclick = () => history.back();
$('docTitle').onclick = () => renameDoc(cur);
$('docMore').onclick = () => docMenu(cur, false);
$('docAdd').onclick = () => addSourceSheet(cur.id);
$('docShare').onclick = () => sharePdf(cur);

$('filters').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-f]');
  if (!b || !cur) return;
  const p = cur.pages[curIdx];
  if (p.filter === b.dataset.f) return;
  p.filter = b.dataset.f;
  updateDocUi();
  await rerender(curIdx);
});
$('tRotate').onclick = async () => {
  const p = cur.pages[curIdx];
  p.rotation = ((p.rotation || 0) + 90) % 360;
  await rerender(curIdx);
};
$('tCrop').onclick = () => openCrop(curIdx);
$('tText').onclick = () => ocrPage(cur.pages[curIdx], curIdx);
$('tOrder').onclick = () => reorderSheet();
$('tDelete').onclick = () => deletePage(curIdx);

function addSourceSheet(docId) {
  openSheet(`
    <h3>إضافة صفحة</h3>
    ${menuItem('cam', 'camera', 'الكاميرا', 'صوّر الورقة الآن')}
    ${menuItem('gal', 'image', 'المعرض', 'يمكنك اختيار عدة صور مرة واحدة')}
  `, (act) => { closeSheet(); pick(act, docId); });
}

function docMenu(doc, fromHome) {
  if (!doc) return;
  const items = [];
  if (fromHome) items.push(menuItem('open', 'doc', 'فتح'));
  items.push(menuItem('rename', 'edit', 'إعادة التسمية'));
  items.push(menuItem('share', 'share', 'مشاركة PDF', 'واتساب، البريد، تيليجرام…'));
  items.push(menuItem('save', 'download', 'حفظ PDF في الجهاز'));
  if (!fromHome) {
    items.push(menuItem('img', 'image', `مشاركة الصفحة ${curIdx + 1} كصورة`));
    if (doc.pages.length > 1) items.push(menuItem('all', 'filter', 'تطبيق الفلتر على كل الصفحات'));
  }
  items.push(menuItem('del', 'trash', 'حذف المستند', '', true));
  openSheet(`<h3>${esc(doc.name)}</h3><p class="sub">${pagesWord(doc.pages.length)} · ${fmtDate(doc.updated)}</p>${items.join('')}`, async (act) => {
    closeSheet();
    if (act === 'open') openDoc(doc.id);
    else if (act === 'rename') renameDoc(doc);
    else if (act === 'share') sharePdf(doc);
    else if (act === 'save') sharePdf(doc, true);
    else if (act === 'img') sharePageImage(doc, curIdx);
    else if (act === 'all') applyFilterAll();
    else if (act === 'del') deleteDoc(doc);
  });
}

function renameDoc(doc) {
  openSheet(`
    <h3>اسم المستند</h3>
    <input class="field" id="renameIn" maxlength="80" placeholder="مثال: عقد الإيجار">
    <div class="sheet-actions">
      <button class="btn btn-outline" data-act="cancel">إلغاء</button>
      <button class="btn btn-primary" data-act="ok">حفظ</button>
    </div>`, async (act) => {
    if (act === 'ok') {
      const v = $('renameIn').value.trim();
      if (v) { doc.name = v; await saveDoc(doc); if (cur === doc) $('docName').textContent = v; await loadDocs(); renderHome(); }
    }
    closeSheet();
  });
  const inp = $('renameIn');
  inp.value = doc.name;
  inp.onkeydown = (e) => { if (e.key === 'Enter') $('sheetBody').querySelector('[data-act="ok"]').click(); };
  setTimeout(() => { inp.focus(); inp.select(); }, 250);
}

function confirmSheet(title, sub, okText) {
  return new Promise((res) => {
    openSheet(`
      <h3>${title}</h3><p class="sub">${sub}</p>
      <div class="sheet-actions">
        <button class="btn btn-outline" data-act="no">إلغاء</button>
        <button class="btn btn-danger" data-act="yes">${okText}</button>
      </div>`, (act) => { closeSheet(); res(act === 'yes'); }, () => res(false));
  });
}

async function deleteDoc(doc) {
  if (!(await confirmSheet('حذف المستند؟', `سيُحذف «${esc(doc.name)}» وكل صفحاته نهائياً. لا يمكن التراجع عن هذا الإجراء.`, 'حذف'))) return;
  for (const p of doc.pages) { await DB.delBlob('o:' + p.id); await DB.delBlob('p:' + p.id); }
  await DB.delDoc(doc.id);
  await loadDocs();
  if (cur && cur.id === doc.id) { cur = null; history.back(); } else renderHome();
}

async function deletePage(i) {
  const last = cur.pages.length === 1;
  const ok = await confirmSheet(`حذف الصفحة ${i + 1}؟`,
    last ? 'هذه آخر صفحة، وحذفها سيحذف المستند بالكامل.' : 'لا يمكن التراجع عن هذا الإجراء.', 'حذف');
  if (!ok) return;
  if (last) {
    const d = cur;
    for (const p of d.pages) { await DB.delBlob('o:' + p.id); await DB.delBlob('p:' + p.id); }
    await DB.delDoc(d.id);
    await loadDocs();
    cur = null;
    history.back();
    return;
  }
  const [p] = cur.pages.splice(i, 1);
  await DB.delBlob('o:' + p.id); await DB.delBlob('p:' + p.id);
  await saveDoc(cur);
  await renderDoc(Math.min(i, cur.pages.length - 1));
}

async function applyFilterAll() {
  const f = cur.pages[curIdx].filter;
  const todo = cur.pages.map((p, i) => i).filter((i) => cur.pages[i].filter !== f);
  if (!todo.length) { toast('كل الصفحات على هذا الفلتر بالفعل'); return; }
  busy(`جارٍ تطبيق الفلتر على ${pagesWord(todo.length)}…`);
  for (const i of todo) { cur.pages[i].filter = f; await rerender(i); }
  busy(false);
  toast('تم تطبيق الفلتر على كل الصفحات');
}

function reorderSheet() {
  if (cur.pages.length < 2) { toast('أضف صفحة أخرى أولاً'); return; }
  const order = cur.pages.slice();
  const draw = () => {
    $('orderList').innerHTML = order.map((p, i) => `
      <div class="order-row">
        <img data-pid="${p.id}" alt="">
        <span>صفحة ${i + 1}</span>
        <button class="icon-btn" data-mv="${i}:-1" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
        <button class="icon-btn" data-mv="${i}:1" ${i === order.length - 1 ? 'disabled' : ''}>${icon('down')}</button>
      </div>`).join('');
    order.forEach((p) => pageUrl(p).then((u) => { const im = $('orderList').querySelector(`img[data-pid="${p.id}"]`); if (im) im.src = u; }));
  };
  openSheet(`
    <h3>ترتيب الصفحات</h3>
    <p class="sub">استخدم الأسهم لتغيير مكان كل صفحة</p>
    <div class="order-list" id="orderList"></div>
    <div class="sheet-actions">
      <button class="btn btn-outline" data-act="cancel">إلغاء</button>
      <button class="btn btn-primary" data-act="ok">حفظ</button>
    </div>`, async (act) => {
    closeSheet();
    if (act === 'ok') { cur.pages = order; await saveDoc(cur); await renderDoc(0); }
  });
  $('orderList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-mv]');
    if (!b) return;
    const [i, dir] = b.dataset.mv.split(':').map(Number);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    draw();
  });
  draw();
}

/* ================= crop ================= */
let crop = null;
async function openCrop(i) {
  const p = cur.pages[i];
  const orig = await loadBlob('o:' + p.id);
  if (!orig) return;
  crop = { i, q: p.quad.slice(), url: URL.createObjectURL(orig) };
  const img = $('cropImg');
  img.onload = () => layoutCrop();
  img.src = crop.url;
  show('crop');
  pushNav();
}
function layoutCrop() {
  if (!crop) return;
  const stage = $('cropStage'), img = $('cropImg'), p = cur.pages[crop.i];
  const sw = stage.clientWidth - 44, sh = stage.clientHeight - 44;
  const k = Math.min(sw / p.w, sh / p.h);
  img.style.width = Math.round(p.w * k) + 'px';
  img.style.height = Math.round(p.h * k) + 'px';
  crop.k = k;
  drawCrop();
}
window.addEventListener('resize', () => { if (crop && !$('crop').classList.contains('hidden')) layoutCrop(); });
function drawCrop() {
  const { q, k } = crop, p = cur.pages[crop.i];
  const W = p.w * k, H = p.h * k;
  const pts = [0, 1, 2, 3].map((j) => [q[j * 2] * k, q[j * 2 + 1] * k]);
  const poly = pts.map((v) => v.join(',')).join(' ');
  $('cropSvg').setAttribute('viewBox', `0 0 ${W} ${H}`);
  $('cropSvg').innerHTML = `
    <defs><mask id="cm"><rect width="${W}" height="${H}" fill="#fff"/><polygon points="${poly}" fill="#000"/></mask></defs>
    <rect width="${W}" height="${H}" fill="rgba(0,0,0,.5)" mask="url(#cm)"/>
    <polygon points="${poly}" fill="rgba(92,200,186,.12)" stroke="#5CC8BA" stroke-width="2.5" stroke-linejoin="round"/>
    ${pts.map((v, j) => `<g data-h="${j}"><circle cx="${v[0]}" cy="${v[1]}" r="24" fill="transparent"/><circle cx="${v[0]}" cy="${v[1]}" r="11" fill="#fff" stroke="#0F7F77" stroke-width="3.5"/></g>`).join('')}`;
}
(() => {
  const svg = $('cropSvg');
  let drag = -1, start = null;
  const toImg = (e) => {
    const r = svg.getBoundingClientRect();
    return [(e.clientX - r.left) / crop.k, (e.clientY - r.top) / crop.k];
  };
  svg.addEventListener('pointerdown', (e) => {
    if (!crop) return;
    const [x, y] = toImg(e);
    let best = -1, bd = Infinity;
    for (let j = 0; j < 4; j++) {
      const d = Math.hypot(crop.q[j * 2] - x, crop.q[j * 2 + 1] - y) * crop.k;
      if (d < bd) { bd = d; best = j; }
    }
    if (bd > 60) return;
    drag = best;
    start = { x, y, qx: crop.q[best * 2], qy: crop.q[best * 2 + 1] };
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (drag < 0) return;
    const p = cur.pages[crop.i];
    const [x, y] = toImg(e);
    crop.q[drag * 2] = Math.max(0, Math.min(p.w, start.qx + x - start.x));
    crop.q[drag * 2 + 1] = Math.max(0, Math.min(p.h, start.qy + y - start.y));
    drawCrop();
  });
  const end = () => { drag = -1; };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
})();
function quadValid(q, w, h) {
  let sgn = 0;
  for (let i = 0; i < 4; i++) {
    const ax = q[i * 2], ay = q[i * 2 + 1], bx = q[((i + 1) % 4) * 2], by = q[((i + 1) % 4) * 2 + 1];
    const cx = q[((i + 2) % 4) * 2], cy = q[((i + 2) % 4) * 2 + 1];
    const cr = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (Math.abs(cr) < 1e-6) return false;
    const s = cr > 0 ? 1 : -1;
    if (!sgn) sgn = s; else if (s !== sgn) return false;
  }
  let ar = 0;
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ar += q[i * 2] * q[j * 2 + 1] - q[j * 2] * q[i * 2 + 1]; }
  return Math.abs(ar) / 2 > w * h * 0.01;
}
function closeCrop() {
  if (crop) URL.revokeObjectURL(crop.url);
  crop = null;
}
$('cAuto').onclick = () => { crop.q = cur.pages[crop.i].autoQuad.slice(); drawCrop(); };
$('cFull').onclick = () => { const p = cur.pages[crop.i]; crop.q = [0, 0, p.w, 0, p.w, p.h, 0, p.h]; drawCrop(); };
$('cCancel').onclick = () => history.back();
$('cOk').onclick = async () => {
  const p = cur.pages[crop.i];
  if (!quadValid(crop.q, p.w, p.h)) { toast('شكل التحديد غير صالح، عدّل الزوايا'); return; }
  p.quad = crop.q.slice();
  const i = crop.i;
  history.back();
  await rerender(i);
};

/* ================= sheet ================= */
let sheetCb = null, sheetCancel = null;
function menuItem(act, ic, title, sub, danger) {
  return `<button class="menu-item${danger ? ' danger' : ''}" data-act="${act}"><span class="mi-ico">${icon(ic)}</span><span>${title}${sub ? `<small>${sub}</small>` : ''}</span></button>`;
}
function openSheet(html, cb, onCancel) {
  $('sheetBody').innerHTML = html;
  paintIcons($('sheetBody'));
  sheetCb = cb; sheetCancel = onCancel || null;
  $('scrim').classList.remove('hidden');
  $('sheet').classList.remove('hidden');
}
function closeSheet(cancelled) {
  if ($('sheet').classList.contains('hidden')) return;
  $('scrim').classList.add('hidden');
  $('sheet').classList.add('hidden');
  const c = sheetCancel;
  sheetCb = null; sheetCancel = null;
  if (cancelled && c) c();
}
$('scrim').onclick = () => closeSheet(true);
$('sheetBody').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b || !sheetCb) return;
  const act = b.dataset.act;
  if (act === 'cancel') { closeSheet(true); return; }
  sheetCb(act, b);
});

/* ================= PDF ================= */
async function buildPdf(doc) {
  const enc = new TextEncoder();
  const parts = [];
  let len = 0;
  const offsets = [];
  const push = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; };
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const n = doc.pages.length;
  // objects: 1 catalog, 2 pages, then per page: page, image, content
  const pageObj = (i) => 3 + i * 3;
  const obj = (num, body) => { offsets[num] = len; push(`${num} 0 obj\n`); body(); push('\nendobj\n'); };
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Count ${n} /Kids [${doc.pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>`));
  for (let i = 0; i < n; i++) {
    const p = doc.pages[i];
    const blob = await loadBlob('p:' + p.id);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const w = p.pw, h = p.ph;
    // A4-width pages (595pt) for portrait, A4-height-ish for landscape
    const base = 595.28;
    const pw = w <= h ? base : base * w / h;
    const ph = pw * h / w;
    const a = pageObj(i), im = a + 1, ct = a + 2;
    obj(a, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`));
    obj(im, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
      push(bytes);
      push('\nendstream');
    });
    const cs = `q ${pw.toFixed(2)} 0 0 ${ph.toFixed(2)} 0 0 cm /Im0 Do Q`;
    obj(ct, () => push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
  }
  const total = 3 + n * 3;
  const xref = len;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) x += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  push(x);
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

function download(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function shareFile(file, title, saveOnly) {
  const canShare = !saveOnly && navigator.canShare && navigator.canShare({ files: [file] });
  if (canShare) {
    try { await navigator.share({ files: [file], title }); return; }
    catch (e) {
      if (e && e.name === 'AbortError') return;
      // Safari needs a fresh tap after a long wait; offer a ready button.
      readySheet(file, title);
      return;
    }
  }
  // iOS Safari opens a PDF preview where the user can save to Files.
  download(file);
}
function readySheet(file, title) {
  openSheet(`
    <h3>الملف جاهز</h3><p class="sub">${esc(file.name)}</p>
    ${menuItem('share', 'share', 'مشاركة', 'واتساب، البريد، تيليجرام…')}
    ${menuItem('save', 'download', 'حفظ في الجهاز')}`, async (act) => {
    closeSheet();
    if (act === 'share') { try { await navigator.share({ files: [file], title }); } catch (e) { if (e.name !== 'AbortError') download(file); } }
    else download(file);
  });
}

async function sharePdf(doc, saveOnly) {
  busy('جارٍ إنشاء ملف PDF…');
  let file;
  try {
    const blob = await buildPdf(doc);
    file = new File([blob], safeFile(doc.name) + '.pdf', { type: 'application/pdf' });
  } catch (e) {
    console.error(e);
    busy(false);
    toast('تعذّر إنشاء الملف');
    return;
  }
  busy(false);
  await shareFile(file, doc.name, saveOnly);
}

async function sharePageImage(doc, i) {
  const b = await loadBlob('p:' + doc.pages[i].id);
  if (!b) return;
  const file = new File([b], `${safeFile(doc.name)} - ${i + 1}.jpg`, { type: 'image/jpeg' });
  await shareFile(file, doc.name);
}

/* ================= OCR (Tesseract.js, on-device) ================= */
let tessP = null, tessWorker = null;
function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('load'));
    document.head.appendChild(s);
  });
}
async function getTess() {
  if (tessWorker) return tessWorker;
  if (!tessP) {
    tessP = (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
      tessWorker = await Tesseract.createWorker(['ara', 'eng'], 1, {
        logger: (m) => onProgressRef && onProgressRef(m),
      });
      return tessWorker;
    })().catch((e) => { tessP = null; throw e; });
  }
  return tessP;
}
let onProgressRef = null;

async function ocrPage(page, i) {
  openSheet(`
    <h3>النص المستخرج</h3>
    <p class="sub" id="ocrStatus">جارٍ قراءة النص…</p>
    <div class="progress"><div id="ocrBar"></div></div>
    <div id="ocrOut"></div>`, async (act) => {
    if (act === 'copy') {
      const t = $('ocrTa').value;
      try { await navigator.clipboard.writeText(t); toast('تم نسخ النص'); }
      catch (e) { $('ocrTa').select(); document.execCommand('copy'); toast('تم نسخ النص'); }
    } else if (act === 'sharetxt') {
      try { await navigator.share({ text: $('ocrTa').value }); } catch (e) { /* ignore */ }
    } else closeSheet();
  });
  const status = $('ocrStatus'), bar = $('ocrBar');
  onProgressRef = (m) => {
    if (!$('ocrBar')) return;
    if (m.status && /load|init/i.test(m.status) && !tessWorker) status.textContent = 'جارٍ تجهيز القارئ (أول مرة فقط، يحتاج إنترنت)…';
    if (m.status === 'recognizing text') status.textContent = 'جارٍ قراءة النص…';
    if (typeof m.progress === 'number') bar.style.width = Math.round(m.progress * 100) + '%';
  };
  try {
    const w = await getTess();
    const blob = await loadBlob('p:' + page.id);
    const { data } = await w.recognize(blob);
    const text = (data.text || '').replace(/\n{3,}/g, '\n\n').trim();
    if (!$('ocrOut')) return;
    $('ocrBar').parentElement.remove();
    if (!text) { status.textContent = 'لم يُعثر على نص في هذه الصفحة.'; return; }
    status.textContent = `صفحة ${i + 1} · يمكنك تعديل النص قبل نسخه`;
    $('ocrOut').innerHTML = `
      <textarea class="ocr-text" id="ocrTa" dir="auto"></textarea>
      <div class="sheet-actions">
        ${navigator.share ? `<button class="btn btn-outline" data-act="sharetxt">${icon('share')}مشاركة</button>` : ''}
        <button class="btn btn-primary" data-act="copy">${icon('copy')}نسخ</button>
      </div>`;
    $('ocrTa').value = text;
  } catch (e) {
    console.error(e);
    if ($('ocrStatus')) status.textContent = navigator.onLine ? 'حدث خطأ أثناء القراءة. حاول مرة أخرى.' : 'استخراج النص يحتاج إنترنت في أول مرة لتنزيل ملفات اللغة.';
  }
}

/* ================= install hint ================= */
function setupInstallHint() {
  const standalone = window.navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let dismissed = false;
  try { dismissed = localStorage.getItem('hintClosed') === '1'; } catch (e) { /* ignore */ }
  if (ios && !standalone && !dismissed) $('installHint').classList.remove('hidden');
  $('hintClose').onclick = () => {
    $('installHint').classList.add('hidden');
    try { localStorage.setItem('hintClosed', '1'); } catch (e) { /* ignore */ }
  };
}

/* ================= boot ================= */
(async function boot() {
  paintIcons();
  setupInstallHint();
  history.replaceState({ root: true }, '');
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  try { await loadDocs(); } catch (e) { console.error(e); toast('تعذّر فتح التخزين في هذا المتصفح'); }
  renderHome();
})();
