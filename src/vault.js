// Document folder: scan IDs and papers with the phone camera, straighten them,
// keep them per family member, and export a print-ready A4 PDF.
// Everything stays on the phone (IndexedDB). Nothing is uploaded.

const CV_SRC = '/src/vendor/opencv/opencv.js';
const MM = 72 / 25.4;                              // PDF points per mm
const A4 = [210, 297];

// Document kinds: size in mm (null = keep the scanned shape), sides, print layout.
const KINDS = {
  passport: { mm: [125, 88], sides: 1, icon: '🛂' },
  nid: { mm: [85.6, 54], sides: 2, icon: '🪪' },
  residence: { mm: [85.6, 54], sides: 2, icon: '🇩🇪' },
  card: { mm: [85.6, 54], sides: 2, icon: '💳' },
  birth: { mm: A4, sides: 1, icon: '👶' },
  paper: { mm: A4, sides: 1, icon: '📄' },
  other: { mm: null, sides: 1, icon: '📎' },
};

const T = {
  Ara: {
    title: 'حافظة المستمسكات',
    intro: 'صوّر مستمسكاتك ومستمسكات عائلتك مرة وحدة، والتطبيق يقصّها ويعدّل ميلانها مثل السكانر. ووقت المعاملة تطلعها PDF جاهز للطباعة بكبسة.',
    private: '🔒 المستمسكات تنحفظ على هذا الموبايل بس، وما تنرسل لأي مكان.',
    warn: '⚠️ إذا مسحت التطبيق أو بيانات المتصفح، أو ضاع الموبايل، تروح المستمسكات. خلي الأصل دائماً عندك.',
    people: 'الأشخاص',
    addPerson: '➕ أضف شخص',
    personName: 'اسم الشخص (مثلاً: أحمد، زوجتي، سارة)',
    me: 'أنا',
    save: 'حفظ',
    cancel: 'إلغاء',
    back: '→ رجوع',
    docsCount: (n) => (n === 0 ? 'ماكو مستمسكات بعد' : n === 1 ? 'مستمسك واحد' : n === 2 ? 'مستمسكين' : `${n} مستمسكات`),
    addDoc: '➕ أضف مستمسك',
    noDocs: 'ماكو مستمسكات لهذا الشخص بعد. اضغط «أضف مستمسك» وصوّر أول وحدة.',
    exportSel: (n) => `📄 صدّر PDF (${n})`,
    exportAll: '📄 صدّر الكل PDF',
    selectHint: 'اختار المستمسكات اللي تريدها بالـ PDF، أو صدّر الكل.',
    share: '📤 مشاركة',
    download: '⬇️ تنزيل',
    pdfReady: 'الملف جاهز ✅ اطبعه بحجم A4 وبالحجم الفعلي (100%) حتى تطلع البطاقات بقياسها الحقيقي.',
    renamePerson: '✏️ تغيير الاسم',
    deletePerson: '🗑️ حذف الشخص ومستمسكاته',
    confirmDelPerson: (n) => `تحذف «${n}» وكل مستمسكاته من هذا الموبايل؟`,
    kindTitle: 'شنو نوع المستمسك؟',
    kinds: { passport: 'الجواز (صفحة المعلومات)', nid: 'البطاقة الوطنية', residence: 'الإقامة الألمانية', card: 'بطاقة ثانية', birth: 'شهادة ميلاد / بيان ولادة', paper: 'ورقة A4', other: 'شي ثاني' },
    docTitle: 'اسم اختياري (مثلاً: جواز قديم)',
    side1: 'صوّر الوجه الأمامي',
    side2: 'صوّر الوجه الخلفي',
    sideOnly: 'صوّر المستمسك',
    tips: 'حط المستمسك على طاولة غامقة، والضوء زين وبدون انعكاس، وخلي الموبايل فوقه مستقيم.',
    camera: '📷 صوّر هسه',
    gallery: '🖼️ اختار صورة من الموبايل',
    loading: 'نجهز أداة التصفيط… أول مرة تنزل ملفات (حوالي 4 ميغا) وبعدها تشتغل بدون نت.',
    working: 'نلكى حواف المستمسك…',
    adjust: 'تأكد إن الزوايا الأربع على حواف المستمسك. إذا لا، اسحب الدوائر بإصبعك.',
    found: '✅ لكينا الحواف',
    notFound: 'ما لكينا الحواف بدقة. اسحب الدوائر الأربع على زوايا المستمسك.',
    rotate: '↻ تدوير',
    useIt: '✂️ قص وعدّل',
    retake: '🔁 صورة ثانية',
    enhance: 'توضيح الكتابة',
    looksGood: '✅ تمام، احفظ',
    nextSide: '➡️ الوجه الخلفي',
    skipBack: 'ماكو وجه خلفي',
    saved: 'انحفظ ✅',
    deleteDoc: '🗑️ حذف المستمسك',
    confirmDelDoc: 'تحذف هذا المستمسك؟',
    exportOne: '📄 PDF لهذا المستمسك',
    error: 'صار خطأ. جرب مرة ثانية، أو حدّث التطبيق.',
    storeError: 'ما كدرنا نحفظ على هذا الموبايل. تأكد إن عندك مساحة فارغة.',
    footer: 'هشام للمعاملات · حافظة المستمسكات',
  },
  Kur: {
    title: 'هەڵگری بەڵگەنامەکان',
    intro: 'یەک جار وێنەی بەڵگەنامەکانی خۆت و خێزانەکەت بگرە، بەرنامەکە وەک سکانەر دەیانبڕێت و ڕاستیان دەکاتەوە. لە کاتی مامەڵەدا بە یەک کرتە PDFی ئامادە بۆ چاپ دەردەهێنیت.',
    private: '🔒 بەڵگەنامەکان تەنها لەسەر ئەم مۆبایلە پاشەکەوت دەکرێن و بۆ هیچ شوێنێک نانێردرێن.',
    warn: '⚠️ ئەگەر بەرنامەکە یان داتای وێبگەڕ بسڕیتەوە، یان مۆبایلەکە ون بێت، بەڵگەنامەکان دەڕۆن. هەمیشە ئەسڵەکە لای خۆت بهێڵەوە.',
    people: 'کەسەکان',
    addPerson: '➕ کەسێک زیاد بکە',
    personName: 'ناوی کەسەکە (بۆ نموونە: ئەحمەد، هاوسەرەکەم، سارا)',
    me: 'خۆم',
    save: 'پاشەکەوت',
    cancel: 'هەڵوەشاندنەوە',
    back: '→ گەڕانەوە',
    docsCount: (n) => (n === 0 ? 'هێشتا بەڵگەنامە نییە' : `${n} بەڵگەنامە`),
    addDoc: '➕ بەڵگەنامەیەک زیاد بکە',
    noDocs: 'هێشتا بەڵگەنامە بۆ ئەم کەسە نییە. «بەڵگەنامەیەک زیاد بکە» دابگرە و یەکەمیان وێنە بگرە.',
    exportSel: (n) => `📄 PDF دەربهێنە (${n})`,
    exportAll: '📄 هەمووی بکە PDF',
    selectHint: 'ئەو بەڵگەنامانە هەڵبژێرە کە دەتەوێت لە PDFەکەدا بن، یان هەمووی دەربهێنە.',
    share: '📤 هاوبەشکردن',
    download: '⬇️ داگرتن',
    pdfReady: 'فایلەکە ئامادەیە ✅ بە قەبارەی A4 و قەبارەی ڕاستەقینە (100%) چاپی بکە بۆ ئەوەی کارتەکان بە قەبارەی خۆیان دەربچن.',
    renamePerson: '✏️ گۆڕینی ناو',
    deletePerson: '🗑️ سڕینەوەی کەسەکە و بەڵگەنامەکانی',
    confirmDelPerson: (n) => `«${n}» و هەموو بەڵگەنامەکانی لەم مۆبایلە دەسڕیتەوە؟`,
    kindTitle: 'جۆری بەڵگەنامەکە چییە؟',
    kinds: { passport: 'پاسپۆرت (لاپەڕەی زانیاری)', nid: 'کارتی نیشتمانی', residence: 'ئیقامەی ئەڵمانی', card: 'کارتێکی تر', birth: 'بڕوانامەی لەدایکبوون', paper: 'پەڕەی A4', other: 'شتێکی تر' },
    docTitle: 'ناوێکی ئارەزوومەندانە (بۆ نموونە: پاسپۆرتی کۆن)',
    side1: 'ڕووی پێشەوە وێنە بگرە',
    side2: 'ڕووی دواوە وێنە بگرە',
    sideOnly: 'بەڵگەنامەکە وێنە بگرە',
    tips: 'بەڵگەنامەکە لەسەر مێزێکی تاریک دابنێ، ڕووناکی باش و بێ ڕەنگدانەوە، و مۆبایلەکە بە ڕاستی لە سەرەوەی بگرە.',
    camera: '📷 ئێستا وێنە بگرە',
    gallery: '🖼️ وێنەیەک لە مۆبایل هەڵبژێرە',
    loading: 'ئامرازی ڕێکخستن ئامادە دەکەین… یەکەم جار فایل دادەبەزێت (نزیکەی 4 مێگا) و دواتر بێ ئینتەرنێت کار دەکات.',
    working: 'لێوارەکانی بەڵگەنامەکە دەدۆزینەوە…',
    adjust: 'دڵنیابە چوار گۆشەکە لەسەر لێوارەکانی بەڵگەنامەکەن. ئەگەر نا، بازنەکان بە پەنجە ڕابکێشە.',
    found: '✅ لێوارەکان دۆزرانەوە',
    notFound: 'لێوارەکان بە وردی نەدۆزرانەوە. چوار بازنەکە ڕابکێشە بۆ گۆشەکانی بەڵگەنامەکە.',
    rotate: '↻ سوڕاندن',
    useIt: '✂️ ببڕە و ڕێکی بخە',
    retake: '🔁 وێنەیەکی تر',
    enhance: 'ڕوونکردنەوەی نووسین',
    looksGood: '✅ باشە، پاشەکەوتی بکە',
    nextSide: '➡️ ڕووی دواوە',
    skipBack: 'ڕووی دواوەی نییە',
    saved: 'پاشەکەوت کرا ✅',
    deleteDoc: '🗑️ سڕینەوەی بەڵگەنامەکە',
    confirmDelDoc: 'ئەم بەڵگەنامەیە دەسڕیتەوە؟',
    exportOne: '📄 PDF بۆ ئەم بەڵگەنامەیە',
    error: 'هەڵەیەک ڕوویدا. دووبارە هەوڵ بدەرەوە یان بەرنامەکە نوێ بکەرەوە.',
    storeError: 'نەمانتوانی لەسەر ئەم مۆبایلە پاشەکەوت بکەین. دڵنیابە شوێنی بەتاڵت هەیە.',
    footer: 'هشام للمعاملات · هەڵگری بەڵگەنامەکان',
  },
};

/* ---------- storage (IndexedDB) ---------- */
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((ok, bad) => {
    const r = indexedDB.open('hesham-vault', 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('people')) d.createObjectStore('people', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('docs')) d.createObjectStore('docs', { keyPath: 'id' }).createIndex('person', 'personId');
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => bad(r.error);
  });
  return dbp;
}
async function tx(store, mode, fn) {
  const d = await db();
  return new Promise((ok, bad) => {
    const t = d.transaction(store, mode); const s = t.objectStore(store);
    let out; const r = fn(s);
    if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
    t.oncomplete = () => ok(out); t.onerror = () => bad(t.error); t.onabort = () => bad(t.error);
  });
}
const allPeople = () => tx('people', 'readonly', (s) => s.getAll()).then((x) => (x || []).sort((a, b) => a.created - b.created));
const putPerson = (p) => tx('people', 'readwrite', (s) => s.put(p));
const docsOf = (pid) => tx('docs', 'readonly', (s) => s.index('person').getAll(pid)).then((x) => (x || []).sort((a, b) => a.created - b.created));
const putDoc = (d) => tx('docs', 'readwrite', (s) => s.put(d));
const delDoc = (id) => tx('docs', 'readwrite', (s) => s.delete(id));
async function delPerson(p) {
  for (const d of await docsOf(p.id)) await delDoc(d.id);
  await tx('people', 'readwrite', (s) => s.delete(p.id));
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------- OpenCV (loaded on first use) ---------- */
let cvp = null;
function loadCv() {
  if (cvp) return cvp;
  cvp = new Promise((ok, bad) => {
    // Resolve with a wrapper: the OpenCV module is "thenable" and would loop forever inside a Promise.
    const ready = (c) => {
      if (c && c.Mat) return ok({ cv: c });
      if (c && typeof c.then === 'function') return c.then((m) => { ok({ cv: m }); });
      if (c) { c.onRuntimeInitialized = () => ok({ cv: c }); return; }
      bad(new Error('opencv missing'));
    };
    if (window.cv) return ready(window.cv);
    const s = document.createElement('script');
    s.src = CV_SRC; s.async = true;
    s.onload = () => ready(window.cv);
    s.onerror = () => { cvp = null; bad(new Error('opencv load failed')); };
    document.head.append(s);
  });
  return cvp;
}

/* ---------- image helpers ---------- */
async function readImage(file, max = 2200) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {
    src = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error('image')); i.src = URL.createObjectURL(file); });
  }
  const w0 = src.width || src.naturalWidth; const h0 = src.height || src.naturalHeight;
  const k = Math.min(1, max / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Order 4 points: top-left, top-right, bottom-right, bottom-left.
function order(pts) {
  const s = pts.map((p) => p.x + p.y); const d = pts.map((p) => p.y - p.x);
  return [pts[s.indexOf(Math.min(...s))], pts[d.indexOf(Math.min(...d))], pts[s.indexOf(Math.max(...s))], pts[d.indexOf(Math.max(...d))]];
}

// Find the document's four corners. Returns { pts, ok }.
function detect(cv, canvas) {
  const W = canvas.width; const H = canvas.height;
  const k = Math.min(1, 640 / Math.max(W, H));
  const small = document.createElement('canvas'); small.width = Math.round(W * k); small.height = Math.round(H * k);
  small.getContext('2d').drawImage(canvas, 0, 0, small.width, small.height);
  const src = cv.imread(small); const g = new cv.Mat(); const e = new cv.Mat();
  const cs = new cv.MatVector(); const hi = new cv.Mat();
  let best = null; let bestArea = 0;
  try {
    cv.cvtColor(src, g, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(g, g, new cv.Size(5, 5), 0);
    const tries = [[30, 90], [60, 160], [15, 60]];
    for (const [lo, hiT] of tries) {
      cv.Canny(g, e, lo, hiT);
      const kern = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
      cv.dilate(e, e, kern); cv.erode(e, e, kern); kern.delete();
      cv.findContours(e, cs, hi, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      const minArea = small.width * small.height * 0.12;
      for (let i = 0; i < cs.size(); i++) {
        const c = cs.get(i); const area = cv.contourArea(c);
        if (area > minArea && area > bestArea) {
          const peri = cv.arcLength(c, true); const ap = new cv.Mat();
          cv.approxPolyDP(c, ap, 0.02 * peri, true);
          if (ap.rows === 4 && cv.isContourConvex(ap)) {
            bestArea = area; best = [];
            for (let j = 0; j < 4; j++) best.push({ x: ap.data32S[j * 2] / k, y: ap.data32S[j * 2 + 1] / k });
          } else if (!best && area > minArea * 1.5) {
            const r = cv.minAreaRect(c); const box = cv.RotatedRect.points(r);
            bestArea = area * 0.9; best = box.map((p) => ({ x: p.x / k, y: p.y / k }));
          }
          ap.delete();
        }
        c.delete();
      }
      if (best && bestArea > small.width * small.height * 0.2) break;
    }
  } finally { src.delete(); g.delete(); e.delete(); cs.delete(); hi.delete(); }
  if (best) return { pts: order(best.map((p) => ({ x: Math.max(0, Math.min(W, p.x)), y: Math.max(0, Math.min(H, p.y)) }))), ok: true };
  const m = 0.06;
  return { pts: [{ x: W * m, y: H * m }, { x: W * (1 - m), y: H * m }, { x: W * (1 - m), y: H * (1 - m) }, { x: W * m, y: H * (1 - m) }], ok: false };
}

// Flatten the document to a straight rectangle.
function warp(cv, canvas, pts, kind) {
  const [tl, tr, br, bl] = pts;
  let w = Math.max(dist(tl, tr), dist(bl, br)); let hgt = Math.max(dist(tl, bl), dist(tr, br));
  const spec = KINDS[kind].mm;
  if (spec) {
    const ratio = Math.max(spec[0], spec[1]) / Math.min(spec[0], spec[1]);
    if (w >= hgt) hgt = w / ratio; else w = hgt / ratio;
  }
  const longSide = spec && spec === A4 ? 2000 : 1600;
  const s = longSide / Math.max(w, hgt);
  const ow = Math.round(w * s); const oh = Math.round(hgt * s);
  const src = cv.imread(canvas); const dst = new cv.Mat();
  const a = cv.matFromArray(4, 1, cv.CV_32FC2, [tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);
  const b = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, ow, 0, ow, oh, 0, oh]);
  const M = cv.getPerspectiveTransform(a, b);
  cv.warpPerspective(src, dst, M, new cv.Size(ow, oh), cv.INTER_CUBIC, cv.BORDER_REPLICATE);
  const out = document.createElement('canvas'); out.width = ow; out.height = oh;
  cv.imshow(out, dst);
  src.delete(); dst.delete(); a.delete(); b.delete(); M.delete();
  return out;
}

function rotate90(c) {
  const o = document.createElement('canvas'); o.width = c.height; o.height = c.width;
  const x = o.getContext('2d'); x.translate(o.width, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0);
  return o;
}

// Clearer text: stretch the levels per channel and sharpen a little.
function enhance(c) {
  const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  const x = o.getContext('2d'); x.drawImage(c, 0, 0);
  const img = x.getImageData(0, 0, o.width, o.height); const d = img.data;
  const hist = [new Uint32Array(256), new Uint32Array(256), new Uint32Array(256)];
  for (let i = 0; i < d.length; i += 16) { hist[0][d[i]]++; hist[1][d[i + 1]]++; hist[2][d[i + 2]]++; }
  const n = d.length / 16; const lo = []; const hi = [];
  for (let ch = 0; ch < 3; ch++) {
    let acc = 0; let l = 0; let h = 255;
    for (let v = 0; v < 256; v++) { acc += hist[ch][v]; if (acc > n * 0.01) { l = v; break; } }
    acc = 0;
    for (let v = 255; v >= 0; v--) { acc += hist[ch][v]; if (acc > n * 0.02) { h = v; break; } }
    lo[ch] = l; hi[ch] = Math.max(l + 40, h);
  }
  for (let i = 0; i < d.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) { const v = (d[i + ch] - lo[ch]) * 255 / (hi[ch] - lo[ch]); d[i + ch] = v < 0 ? 0 : v > 255 ? 255 : v; }
  }
  x.putImageData(img, 0, 0);
  // light unsharp mask
  const b = document.createElement('canvas'); b.width = o.width; b.height = o.height;
  const bx = b.getContext('2d'); bx.filter = 'blur(1.2px)'; bx.drawImage(o, 0, 0);
  if (bx.filter === 'blur(1.2px)') {
    const s = x.getImageData(0, 0, o.width, o.height); const bl = bx.getImageData(0, 0, o.width, o.height);
    for (let i = 0; i < s.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) { const v = s.data[i + ch] + 0.6 * (s.data[i + ch] - bl.data[i + ch]); s.data[i + ch] = v < 0 ? 0 : v > 255 ? 255 : v; }
    }
    x.putImageData(s, 0, 0);
  }
  return o;
}

const toBlob = (c, q = 0.88) => new Promise((ok) => c.toBlob(ok, 'image/jpeg', q));
async function blobToImg(blob) {
  try { return await createImageBitmap(blob); } catch (e) {
    return new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = URL.createObjectURL(blob); });
  }
}

/* ---------- PDF (A4, real sizes) ---------- */
// pages: [[{ jpeg: Uint8Array, w, h, x, y, mw, mh }]] with x/y/mw/mh in mm from the top-left.
function buildPdf(pages) {
  const enc = new TextEncoder(); const chunks = []; const xref = []; let size = 0;
  const put = (p) => { const b = typeof p === 'string' ? enc.encode(p) : p; chunks.push(b); size += b.length; };
  const obj = (id, head, stream) => { xref[id] = size; put(`${id} 0 obj\n${head}\n`); if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); } put('endobj\n'); };
  const PW = A4[0] * MM; const PH = A4[1] * MM;
  let next = 3; const pageIds = [];
  const plan = pages.map((imgs) => { const pid = next++; const cid = next++; const ids = imgs.map(() => next++); pageIds.push(pid); return { pid, cid, ids, imgs }; });
  put('%PDF-1.4\n%âãÏÓ\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] >>`);
  for (const p of plan) {
    const res = p.imgs.map((_, i) => `/I${i} ${p.ids[i]} 0 R`).join(' ');
    obj(p.pid, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW.toFixed(2)} ${PH.toFixed(2)}] /Resources << /XObject << ${res} >> >> /Contents ${p.cid} 0 R >>`);
    let draw = '';
    p.imgs.forEach((im, i) => {
      const w = im.mw * MM; const hh = im.mh * MM; const x = im.x * MM; const y = PH - im.y * MM - hh;
      draw += `q ${w.toFixed(2)} 0 0 ${hh.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /I${i} Do Q\n`;
      draw += `q 0.75 G 0.4 w ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${hh.toFixed(2)} re S Q\n`;
    });
    const db = enc.encode(draw);
    obj(p.cid, `<< /Length ${db.length} >>`, db);
    p.imgs.forEach((im, i) => obj(p.ids[i], `<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /BitsPerComponent 8 /ColorSpace /DeviceRGB /Filter /DCTDecode /Length ${im.jpeg.length} >>`, im.jpeg));
  }
  const start = size; let table = `xref\n0 ${next}\n0000000000 65535 f \n`;
  for (let id = 1; id < next; id++) table += `${String(xref[id] || 0).padStart(10, '0')} 00000 n \n`;
  put(`${table}trailer\n<< /Size ${next} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

// Size on paper (mm) for one scanned side.
function paperSize(kind, w, h) {
  const spec = KINDS[kind].mm;
  const land = w >= h;
  if (spec && spec !== A4) { const L = Math.max(...spec); const S = Math.min(...spec); return land ? [L, S] : [S, L]; }
  const maxW = A4[0] - 20; const maxH = A4[1] - 24;
  const k = Math.min(maxW / w, maxH / h);
  return [w * k, h * k];
}

async function docsToPdf(docs) {
  const pages = [];
  for (const d of docs) {
    const imgs = [];
    let y = 22;
    for (const blob of d.pages) {
      const bmp = await blobToImg(blob);
      const w = bmp.width; const hh = bmp.height;
      const [mw, mh] = paperSize(d.kind, w, hh);
      imgs.push({ jpeg: new Uint8Array(await blob.arrayBuffer()), w, h: hh, mw, mh, x: (A4[0] - mw) / 2, y: KINDS[d.kind].mm === A4 || !KINDS[d.kind].mm ? (A4[1] - mh) / 2 : y });
      y += mh + 14;
    }
    pages.push(imgs);
  }
  return buildPdf(pages);
}

/* ---------- UI ---------- */
export function openVault({ h, sheet, closeSheet, lang, count, toast }) {
  const s = T[lang] || T.Ara;
  count && count('vault_open');
  const root = h('div', { class: 'request vault' });
  sheet(root, { tall: true });
  const show = (...kids) => { root.replaceChildren(...kids.flat().filter(Boolean)); root.closest('.sheet')?.scrollTo?.(0, 0); };
  const top = (onBack) => h('div', { class: 'picker-top' },
    onBack ? h('button', { class: 'btn soft vback', type: 'button', text: s.back, onclick: onBack }) : h('h2', { text: s.title }),
    h('button', { class: 'x', type: 'button', 'aria-label': '✕', onclick: closeSheet, text: '✕' }));
  const fail = (e, msg) => { console.error(e); count && count('vault_error', { why: String((e && e.message) || e).slice(0, 120) }); toast && toast(msg || s.error); };
  const urls = [];
  const thumbUrl = (blob) => { const u = URL.createObjectURL(blob); urls.push(u); return u; };

  async function home() {
    let people;
    try { people = await allPeople(); } catch (e) { fail(e, s.storeError); people = []; }
    if (!people.length) {
      const p = { id: uid(), name: s.me, created: Date.now() };
      try { await putPerson(p); people = [p]; } catch (e) { fail(e, s.storeError); }
    }
    const counts = await Promise.all(people.map((p) => docsOf(p.id).then((d) => d.length).catch(() => 0)));
    show(top(),
      h('p', { class: 'note', text: s.intro }),
      h('p', { class: 'trust', text: s.private }),
      h('p', { class: 'qlabel', text: s.people }),
      h('div', { class: 'vault-people' }, people.map((p, i) => h('button', { class: 'vault-person', type: 'button', onclick: () => person(p) },
        h('span', { class: 'vp-av', text: (p.name || '?').trim().charAt(0) }),
        h('span', { class: 'vp-txt' }, h('b', { text: p.name }), h('small', { text: s.docsCount(counts[i]) }))))),
      h('button', { class: 'btn soft wide', type: 'button', text: s.addPerson, onclick: () => nameForm(null) }),
      h('p', { class: 'notice', text: s.warn }));
  }

  function nameForm(p) {
    const inp = h('input', { class: 'inp', type: 'text', maxlength: '40', placeholder: s.personName, value: p ? p.name : '' });
    const go = async () => {
      const name = inp.value.trim(); if (!name) { inp.focus(); return; }
      const rec = p ? { ...p, name } : { id: uid(), name, created: Date.now() };
      try { await putPerson(rec); } catch (e) { return fail(e, s.storeError); }
      count && count(p ? 'vault_rename' : 'vault_person');
      p ? person(rec) : home();
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    show(top(() => (p ? person(p) : home())), h('label', { class: 'qlabel', text: s.personName }), inp,
      h('button', { class: 'btn primary wide big', type: 'button', text: s.save, onclick: go }));
    setTimeout(() => inp.focus(), 50);
  }

  async function person(p) {
    let docs = [];
    try { docs = await docsOf(p.id); } catch (e) { fail(e, s.storeError); }
    const sel = new Set();
    const expBtn = h('button', { class: 'btn primary wide big', type: 'button', text: docs.length ? s.exportAll : s.addDoc });
    const refresh = () => { expBtn.textContent = sel.size ? s.exportSel(sel.size) : s.exportAll; };
    expBtn.addEventListener('click', () => {
      if (!docs.length) return addDoc(p);
      exportPdf(docs.filter((d) => !sel.size || sel.has(d.id)), p.name, () => person(p));
    });
    const grid = h('div', { class: 'vault-docs' }, docs.map((d) => {
      const box = h('input', { type: 'checkbox', class: 'vd-sel', 'aria-label': s.kinds[d.kind] });
      box.addEventListener('change', () => { box.checked ? sel.add(d.id) : sel.delete(d.id); refresh(); });
      box.addEventListener('click', (e) => e.stopPropagation());
      return h('div', { class: 'vault-doc', onclick: () => docView(p, d) },
        h('img', { src: thumbUrl(d.pages[0]), alt: '' }),
        h('span', { class: 'vd-txt' }, h('b', { text: `${KINDS[d.kind].icon} ${d.title || s.kinds[d.kind]}` }), d.pages.length > 1 ? h('small', { text: '2 ×' }) : null),
        box);
    }));
    show(top(() => home()),
      h('h2', { class: 'vault-name', text: p.name }),
      docs.length ? h('p', { class: 'hint', text: s.selectHint }) : h('p', { class: 'note', text: s.noDocs }),
      docs.length ? grid : null,
      docs.length ? expBtn : null,
      h('button', { class: docs.length ? 'btn soft wide' : 'btn primary wide big', type: 'button', text: s.addDoc, onclick: () => addDoc(p) }),
      h('div', { class: 'two' },
        h('button', { class: 'btn soft', type: 'button', text: s.renamePerson, onclick: () => nameForm(p) }),
        h('button', { class: 'btn small', type: 'button', text: s.deletePerson, onclick: async () => {
          if (!confirm(s.confirmDelPerson(p.name))) return;
          try { await delPerson(p); count && count('vault_delperson'); } catch (e) { return fail(e, s.storeError); }
          home();
        } })));
  }

  function addDoc(p) {
    let kind = null;
    const title = h('input', { class: 'inp', type: 'text', maxlength: '40', placeholder: s.docTitle });
    const chips = h('div', { class: 'chips big' }, Object.keys(KINDS).map((k) => h('button', { class: 'chipbtn', type: 'button', text: `${KINDS[k].icon} ${s.kinds[k]}`,
      onclick: (e) => { kind = k; chips.querySelectorAll('.chipbtn').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); capture(p, { kind, title: title.value.trim(), pages: [] }); } })));
    show(top(() => person(p)), h('p', { class: 'qlabel', text: s.kindTitle }), chips, h('label', { class: 'hint', text: s.docTitle }), title);
  }

  function fileInput(capture, on) {
    const i = h('input', { type: 'file', accept: 'image/*', hidden: true });
    if (capture) i.setAttribute('capture', 'environment');
    i.addEventListener('change', () => { if (i.files && i.files[0]) on(i.files[0]); });
    return i;
  }

  function capture(p, draft) {
    const two = KINDS[draft.kind].sides === 2; const side = draft.pages.length;
    const label = two ? (side === 0 ? s.side1 : s.side2) : s.sideOnly;
    const cam = fileInput(true, (f) => scan(p, draft, f)); const gal = fileInput(false, (f) => scan(p, draft, f));
    show(top(() => (side ? review(p, draft) : addDoc(p))),
      h('h2', { class: 'vault-name', text: `${KINDS[draft.kind].icon} ${label}` }),
      h('p', { class: 'hint', text: s.tips }),
      h('button', { class: 'btn primary wide big', type: 'button', text: s.camera, onclick: () => cam.click() }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.gallery, onclick: () => gal.click() }),
      side && two ? h('button', { class: 'btn soft wide', type: 'button', text: s.skipBack, onclick: () => save(p, draft) }) : null,
      cam, gal);
  }

  async function scan(p, draft, file) {
    const msg = h('p', { class: 'note', text: s.loading });
    show(top(null), h('div', { class: 'photo-wait' }, h('div', { class: 'spin' }), msg));
    let cv; let canvas; let found;
    try {
      cv = (await loadCv()).cv; msg.textContent = s.working;
      canvas = await readImage(file);
      found = detect(cv, canvas);
    } catch (e) { fail(e); return capture(p, draft); }
    count && count(found.ok ? 'vault_detect_ok' : 'vault_detect_miss');
    cropEditor(p, draft, cv, canvas, found);
  }

  function cropEditor(p, draft, cv, canvas, found) {
    let pts = found.pts.map((q) => ({ ...q }));
    const view = h('canvas', { class: 'vault-crop' });
    const maxW = Math.min(window.innerWidth - 40, 520);
    const k = Math.min(maxW / canvas.width, (window.innerHeight * 0.58) / canvas.height);
    view.width = Math.round(canvas.width * k); view.height = Math.round(canvas.height * k);
    const ctx = view.getContext('2d');
    const paint = () => {
      ctx.drawImage(canvas, 0, 0, view.width, view.height);
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.beginPath(); ctx.rect(0, 0, view.width, view.height);
      ctx.moveTo(pts[0].x * k, pts[0].y * k); for (let i = 3; i >= 0; i--) ctx.lineTo(pts[i].x * k, pts[i].y * k);
      ctx.closePath(); ctx.fill('evenodd');
      ctx.strokeStyle = '#2fd37a'; ctx.lineWidth = 3; ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(q.x * k, q.y * k) : ctx.moveTo(q.x * k, q.y * k))); ctx.closePath(); ctx.stroke();
      pts.forEach((q) => { ctx.beginPath(); ctx.arc(q.x * k, q.y * k, 14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(47,211,122,.35)'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); });
    };
    paint();
    let drag = -1;
    const pos = (e) => { const r = view.getBoundingClientRect(); return { x: (e.clientX - r.left) * (view.width / r.width) / k, y: (e.clientY - r.top) * (view.height / r.height) / k }; };
    view.addEventListener('pointerdown', (e) => {
      const q = pos(e); let bi = -1; let bd = 1e9;
      pts.forEach((c, i) => { const d = dist(c, q); if (d < bd) { bd = d; bi = i; } });
      if (bd * k < 48) { drag = bi; view.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    view.addEventListener('pointermove', (e) => {
      if (drag < 0) return; const q = pos(e);
      pts[drag] = { x: Math.max(0, Math.min(canvas.width, q.x)), y: Math.max(0, Math.min(canvas.height, q.y)) }; paint();
    });
    const end = () => { drag = -1; };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
    show(top(() => capture(p, draft)),
      h('p', { class: found.ok ? 'trust' : 'notice', text: found.ok ? `${s.found}. ${s.adjust}` : s.notFound }),
      h('div', { class: 'vault-cropwrap' }, view),
      h('button', { class: 'btn primary wide big', type: 'button', text: s.useIt, onclick: () => {
        let flat;
        try { flat = warp(cv, canvas, order(pts), draft.kind); } catch (e) { return fail(e); }
        result(p, draft, flat);
      } }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.retake, onclick: () => capture(p, draft) }));
  }

  function result(p, draft, flat) {
    let base = flat; let on = true; let shown = enhance(base);
    const img = h('img', { class: 'vault-result', alt: '' });
    const paint = () => { shown = on ? enhance(base) : base; img.src = shown.toDataURL('image/jpeg', 0.85); };
    paint();
    const tog = h('input', { type: 'checkbox', checked: true });
    tog.addEventListener('change', () => { on = tog.checked; paint(); });
    const two = KINDS[draft.kind].sides === 2;
    const keep = async () => { draft.pages.push(await toBlob(shown)); };
    show(top(() => capture(p, draft)),
      h('div', { class: 'vault-resultwrap' }, img),
      h('div', { class: 'two' },
        h('button', { class: 'btn soft', type: 'button', text: s.rotate, onclick: () => { base = rotate90(base); paint(); } }),
        h('label', { class: 'check' }, tog, h('span', { text: s.enhance }))),
      two && draft.pages.length === 0
        ? h('button', { class: 'btn primary wide big', type: 'button', text: s.nextSide, onclick: async () => { await keep(); capture(p, draft); } })
        : null,
      h('button', { class: two && draft.pages.length === 0 ? 'btn soft wide' : 'btn primary wide big', type: 'button', text: s.looksGood, onclick: async () => { await keep(); save(p, draft); } }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.retake, onclick: () => capture(p, draft) }));
  }

  function review(p, draft) { if (draft.pages.length) save(p, draft); else capture(p, draft); }

  async function save(p, draft) {
    if (!draft.pages.length) return capture(p, draft);
    const d = { id: uid(), personId: p.id, kind: draft.kind, title: draft.title || '', pages: draft.pages, created: Date.now() };
    try { await putDoc(d); } catch (e) { return fail(e, s.storeError); }
    count && count('vault_save', { kind: d.kind, sides: d.pages.length });
    toast && toast(s.saved);
    person(p);
  }

  function docView(p, d) {
    show(top(() => person(p)),
      h('h2', { class: 'vault-name', text: `${KINDS[d.kind].icon} ${d.title || s.kinds[d.kind]}` }),
      d.pages.map((b) => h('div', { class: 'vault-resultwrap' }, h('img', { class: 'vault-result', src: thumbUrl(b), alt: '' }))),
      h('button', { class: 'btn primary wide big', type: 'button', text: s.exportOne, onclick: () => exportPdf([d], `${p.name}-${s.kinds[d.kind]}`, () => docView(p, d)) }),
      h('button', { class: 'btn small wide', type: 'button', text: s.deleteDoc, onclick: async () => {
        if (!confirm(s.confirmDelDoc)) return;
        try { await delDoc(d.id); count && count('vault_deldoc'); } catch (e) { return fail(e, s.storeError); }
        person(p);
      } }));
  }

  async function exportPdf(docs, name, onBack) {
    show(top(null), h('div', { class: 'photo-wait' }, h('div', { class: 'spin' })));
    let blob;
    try { blob = await docsToPdf(docs); } catch (e) { fail(e); return onBack(); }
    count && count('vault_pdf', { docs: docs.length });
    const fname = `${(name || 'docs').replace(/[\\/:*?"<>|]+/g, '-')}.pdf`;
    const file = new File([blob], fname, { type: 'application/pdf' });
    const canShare = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] }));
    const dl = () => { const u = URL.createObjectURL(blob); const a = h('a', { href: u, download: fname }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000); };
    show(top(onBack),
      h('div', { class: 'vault-pdf', text: '📄' }),
      h('p', { class: 'trust', text: s.pdfReady }),
      canShare ? h('button', { class: 'btn primary wide big', type: 'button', text: s.share, onclick: async () => { try { await navigator.share({ files: [file], title: fname }); } catch (e) { /* cancelled */ } } }) : null,
      h('button', { class: canShare ? 'btn soft wide' : 'btn primary wide big', type: 'button', text: s.download, onclick: dl }));
  }

  home();
}
