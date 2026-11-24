// White-background passport-style photo (35 × 45 mm) for Iraqi paperwork.
// Everything runs on the phone: the photo is never uploaded anywhere.
// Face finding and background removal use MediaPipe models served from /vendor/mediapipe.

const MM = 300 / 25.4;                  // pixels per mm at 300 dpi
const PW = Math.round(35 * MM);         // 413
const PH = Math.round(45 * MM);         // 531
const SHEET_W = Math.round(150 * MM);   // 10 × 15 cm print, landscape
const SHEET_H = Math.round(100 * MM);
const GAP = Math.round(3 * MM);
const BASE = '/src/vendor/mediapipe';

const T = {
  Ara: {
    title: 'صورة بخلفية بيضاء',
    intro: 'صوّر نفسك بالموبايل، والتطبيق يقصّ الصورة على قياس صورة الجواز (35×45 ملم) ويخلي الخلفية بيضاء. تطلعلك ورقة بيها 8 صور تطبعها بماكنة الصور بـ dm أو Rossmann بقروش، وصورة رقمية للرفع أونلاين.',
    private: '🔒 الصورة تنعالج على موبايلك بس، وما تنرسل لأي مكان.',
    german: '⚠️ ما تنفع للجواز الألماني والإقامة والـ Reiseausweis: هذني من أيار 2025 يحتاجون صورة رقمية من مصور معتمد أو من الدائرة نفسها.',
    tipsTitle: 'حتى تطلع الصورة صح',
    tips: [
      'وقف قدام حايط فاتح، والضوء يجي من قدامك مو من وراك.',
      'خلي أحد يصورك، والموبايل بمستوى عيونك وعلى بعد متر تقريباً.',
      'وجه مستقيم، عيون مفتوحة، وفم مسدود بدون ابتسامة عريضة.',
      'بدون نظارات شمسية أو قبعة. الحجاب مسموح بشرط الوجه كامل يبين.',
    ],
    camera: '📷 صوّر هسه',
    gallery: '🖼️ اختار صورة من الموبايل',
    loadingFirst: 'نجهز أداة الصور… أول مرة تنزل ملفات (حوالي 10 ميغا) وبعدها تشتغل بدون نت.',
    working: 'نلكى الوجه ونبيّض الخلفية…',
    noFace: 'ما لكينا وجه واضح بالصورة. صوّر مرة ثانية والوجه قريب وواضح.',
    failed: 'صار خطأ بمعالجة الصورة. جرب صورة ثانية، أو حدّث التطبيق.',
    many: 'بالصورة أكثر من وجه. خلي شخص واحد بس بالصورة.',
    small: 'الوجه صغير بالصورة، فالجودة ممكن تكون ضعيفة بالطباعة. قرّب الموبايل شوية.',
    dark: 'الإضاءة ضعيفة على الوجه. صوّر قرب شباك أو ضوء من قدامك.',
    tilt: 'راسك شوية مايل. خلي وجهك مستقيم.',
    ok: '✅ الصورة تبين زينة. راجعها قبل لا تطبع.',
    size: 'حجم الوجه',
    move: 'فوق / تحت',
    sheetBtn: '🖨️ نزّل ورقة الطباعة (8 صور · 10×15)',
    singleBtn: '⬇️ نزّل صورة وحدة (رقمية)',
    share: '📤 مشاركة',
    retake: '🔁 صورة ثانية',
    printHow: 'شلون تطبعها: افتح ملف الورقة بماكنة الصور بـ dm أو Rossmann أو أي محل صور، واختار قياس 10×15. بعدها قص الصور على الخطوط.',
    check: 'الدائرة هي اللي تقرر تقبل الصورة لو لا. إذا الصورة مو واضحة أو بيها ظل، صوّر مرة ثانية.',
    saved: 'انحفظت ✅',
    footer: 'هشام للمعاملات · 35×45 ملم',
  },
  Kur: {
    title: 'وێنە بە باکگراوندی سپی',
    intro: 'بە مۆبایل وێنەی خۆت بگرە، بەرنامەکە وێنەکە بە قەبارەی وێنەی پاسپۆرت (35×45 ملم) دەبڕێت و باکگراوندەکەی سپی دەکات. پەڕەیەکت بە 8 وێنە بۆ دەردەچێت کە لە مەکینەی وێنەی dm یان Rossmann بە کەمێک چاپی بکەیت، و وێنەیەکی دیجیتاڵ بۆ ناردنی ئۆنلاین.',
    private: '🔒 وێنەکە تەنها لەسەر مۆبایلەکەت چارەسەر دەکرێت و بۆ هیچ شوێنێک نانێردرێت.',
    german: '⚠️ بۆ پاسپۆرتی ئەڵمانی و ئیقامە و Reiseausweis بەکار نایەت: لە ئایاری 2025ەوە ئەمانە وێنەی دیجیتاڵ لە وێنەگری پەسەندکراو یان لە فەرمانگە خۆی پێویستە.',
    tipsTitle: 'بۆ ئەوەی وێنەکە باش دەربچێت',
    tips: [
      'لە پێش دیوارێکی کاڵ بوەستە، ڕووناکی لە پێشەوە بێت نەک لە دواوە.',
      'با کەسێک وێنەت بگرێت، مۆبایل بە ئاستی چاوت و نزیکەی یەک مەتر دوور.',
      'ڕووخسار ڕاست، چاو کراوە، دەم داخراو بێ پێکەنینی گەورە.',
      'بێ چاویلکەی خۆر یان کڵاو. حیجاب ڕێگەپێدراوە بە مەرجێک ڕووخسار بە تەواوی دیار بێت.',
    ],
    camera: '📷 ئێستا وێنە بگرە',
    gallery: '🖼️ وێنەیەک لە مۆبایل هەڵبژێرە',
    loadingFirst: 'ئامرازی وێنە ئامادە دەکەین… یەکەم جار فایل دادەبەزێت (نزیکەی 10 مێگا) و دواتر بێ ئینتەرنێت کار دەکات.',
    working: 'ڕووخسار دەدۆزینەوە و باکگراوند سپی دەکەین…',
    noFace: 'ڕووخسارێکی ڕوون لە وێنەکەدا نەدۆزرایەوە. دووبارە وێنە بگرە و ڕووخسار نزیک و ڕوون بێت.',
    failed: 'هەڵەیەک لە چارەسەرکردنی وێنەکەدا ڕوویدا. وێنەیەکی تر تاقی بکەرەوە یان بەرنامەکە نوێ بکەرەوە.',
    many: 'زیاتر لە ڕووخسارێک لە وێنەکەدایە. تەنها یەک کەس با لە وێنەکەدا بێت.',
    small: 'ڕووخسار لە وێنەکەدا بچووکە، لەوانەیە چاپەکە کوالیتی کەم بێت. مۆبایل کەمێک نزیک بکەرەوە.',
    dark: 'ڕووناکی سەر ڕووخسار کەمە. لە نزیک پەنجەرە یان ڕووناکی لە پێشەوە وێنە بگرە.',
    tilt: 'سەرت کەمێک لارە. ڕووخسارت ڕاست ڕابگرە.',
    ok: '✅ وێنەکە باش دیارە. پێش چاپکردن پێیدا بچۆرەوە.',
    size: 'قەبارەی ڕووخسار',
    move: 'سەرەوە / خوارەوە',
    sheetBtn: '🖨️ پەڕەی چاپ دابەزێنە (8 وێنە · 10×15)',
    singleBtn: '⬇️ یەک وێنە دابەزێنە (دیجیتاڵ)',
    share: '📤 هاوبەشکردن',
    retake: '🔁 وێنەیەکی تر',
    printHow: 'چۆن چاپی بکەیت: فایلی پەڕەکە لە مەکینەی وێنەی dm یان Rossmann یان هەر دوکانێکی وێنە بکەرەوە و قەبارەی 10×15 هەڵبژێرە. دواتر وێنەکان لەسەر هێڵەکان ببڕە.',
    check: 'فەرمانگەکە بڕیار دەدات وێنەکە وەردەگرێت یان نا. ئەگەر وێنەکە ڕوون نییە یان سێبەری هەیە، دووبارە وێنە بگرە.',
    saved: 'پاشەکەوت کرا ✅',
    footer: 'هشام للمعاملات · 35×45 ملم',
  },
};

let models = null;
async function loadModels() {
  if (models) return models;
  const v = await import(`${BASE}/vision_bundle.js`);
  const fileset = await v.FilesetResolver.forVisionTasks(`${BASE}/wasm`);
  const face = await v.FaceDetector.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: `${BASE}/models/face_detector.tflite`, delegate: 'CPU' },
    runningMode: 'IMAGE', minDetectionConfidence: 0.5,
  });
  const seg = await v.ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: `${BASE}/models/selfie_segmenter.tflite`, delegate: 'CPU' },
    runningMode: 'IMAGE', outputConfidenceMasks: true, outputCategoryMask: false,
  });
  models = { face, seg };
  return models;
}

// Read the picked file (respecting phone rotation) into a canvas no bigger than 1600 px.
async function readImage(file) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {
    src = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = URL.createObjectURL(file); });
  }
  const w0 = src.width || src.naturalWidth; const h0 = src.height || src.naturalHeight;
  const k = Math.min(1, 1600 / Math.max(w0, h0));
  const c = document.createElement('canvas');
  c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// Replace the background with white, using the person mask with soft edges.
function whiten(canvas, mask) {
  const { width: w, height: hh } = canvas;
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, hh);
  const d = img.data;
  // light blur of the mask so hair and shoulders blend softly
  const m = new Float32Array(mask.length);
  const r = 2;
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0; let n = 0;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= hh) continue;
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) continue;
          s += mask[yy * w + xx]; n++;
        }
      }
      m[y * w + x] = s / n;
    }
  }
  for (let i = 0; i < m.length; i++) {
    let a = (m[i] - 0.25) / 0.5; a = a < 0 ? 0 : a > 1 ? 1 : a; a = a * a * (3 - 2 * a);
    const j = i * 4;
    d[j] = d[j] * a + 255 * (1 - a);
    d[j + 1] = d[j + 1] * a + 255 * (1 - a);
    d[j + 2] = d[j + 2] * a + 255 * (1 - a);
  }
  ctx.putImageData(img, 0, 0);
}

async function analyse(file) {
  const { face, seg } = await loadModels();
  const canvas = await readImage(file);
  const found = face.detect(canvas).detections.filter((x) => (x.categories?.[0]?.score ?? 1) > 0.5);
  if (!found.length) return { error: 'noFace' };
  found.sort((a, b) => b.boundingBox.width * b.boundingBox.height - a.boundingBox.width * a.boundingBox.height);
  const f = found[0];
  const big = f.boundingBox.width * f.boundingBox.height;
  const warn = [];
  if (found.length > 1 && found[1].boundingBox.width * found[1].boundingBox.height > big * 0.25) warn.push('many');
  if (f.boundingBox.width < 150) warn.push('small');
  const kp = f.keypoints || [];
  const W = canvas.width; const H = canvas.height;
  const eyeR = kp[0] ? { x: kp[0].x * W, y: kp[0].y * H } : null;
  const eyeL = kp[1] ? { x: kp[1].x * W, y: kp[1].y * H } : null;
  if (eyeR && eyeL) {
    const deg = Math.abs(Math.atan2(eyeL.y - eyeR.y, eyeL.x - eyeR.x) * 180 / Math.PI);
    if (Math.min(deg, 180 - deg) > 7) warn.push('tilt');
  }
  // brightness of the face box
  const bb = f.boundingBox;
  const px = canvas.getContext('2d').getImageData(Math.max(0, bb.originX), Math.max(0, bb.originY),
    Math.max(1, Math.min(bb.width, W - bb.originX)), Math.max(1, Math.min(bb.height, H - bb.originY))).data;
  let lum = 0; for (let i = 0; i < px.length; i += 16) lum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
  if (lum / (px.length / 16) < 75) warn.push('dark');

  // Read the person mask. Some phone GPUs can't read float textures, so fall back to 8-bit.
  let mask;
  const res = seg.segment(canvas);
  const conf = res.confidenceMasks[0];
  try { mask = conf.getAsFloat32Array(); } catch (e1) {
    const u8 = conf.getAsUint8Array(); mask = new Float32Array(u8.length);
    for (let i = 0; i < u8.length; i++) mask[i] = u8[i] / 255;
  }
  whiten(canvas, mask);
  res.close?.();

  // head geometry: eyes sit about halfway between the top of the head and the chin
  const eyeY = eyeR && eyeL ? (eyeR.y + eyeL.y) / 2 : bb.originY + bb.height * 0.38;
  const cx = eyeR && eyeL ? (eyeR.x + eyeL.x) / 2 : bb.originX + bb.width / 2;
  const chinY = bb.originY + bb.height * 1.02;
  const headH = (chinY - eyeY) * 2.05;
  return { canvas, cx, eyeY, chinY, headH, warn };
}

// Draw the 35 × 45 mm photo. zoom 1 = head is 74 % of the photo height.
function drawPhoto(a, zoom = 1, shift = 0) {
  const out = document.createElement('canvas'); out.width = PW; out.height = PH;
  const ctx = out.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, PW, PH);
  const cropH = a.headH / (0.71 * zoom);
  const cropW = cropH * PW / PH;
  const crown = a.chinY - a.headH;
  const top = crown - cropH * (0.12 + shift * 0.06);
  const left = a.cx - cropW / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(a.canvas, left, top, cropW, cropH, 0, 0, PW, PH);
  return out;
}

function drawSheet(photo, footer) {
  const c = document.createElement('canvas'); c.width = SHEET_W; c.height = SHEET_H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  const cols = 4; const rows = 2;
  const gw = cols * PW + (cols - 1) * GAP; const gh = rows * PH + (rows - 1) * GAP;
  const x0 = Math.round((SHEET_W - gw) / 2); const y0 = Math.round((SHEET_H - gh) / 2) - 10;
  ctx.strokeStyle = '#c8c8c8'; ctx.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const x = x0 + k * (PW + GAP); const y = y0 + r * (PH + GAP);
      ctx.drawImage(photo, x, y);
      ctx.strokeRect(x - 0.5, y - 0.5, PW + 1, PH + 1);
    }
  }
  ctx.fillStyle = '#9a9a9a'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(footer, SHEET_W / 2, SHEET_H - 14);
  return c;
}

const toBlob = (c) => new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.95));
async function download(c, name) {
  const b = await toBlob(c);
  const url = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function openPhoto({ h, sheet, closeSheet, lang, count, toast }) {
  const s = T[lang] || T.Ara;
  count && count('photo_open');
  const top = () => h('div', { class: 'picker-top' }, h('h2', { text: s.title }),
    h('button', { class: 'x', type: 'button', 'aria-label': '✕', onclick: closeSheet, text: '✕' }));

  const fileInput = (capture) => {
    const i = h('input', { type: 'file', accept: 'image/*', hidden: true });
    if (capture) i.setAttribute('capture', 'user');
    i.addEventListener('change', () => { if (i.files && i.files[0]) run(i.files[0]); });
    return i;
  };

  function start() {
    const cam = fileInput(true); const gal = fileInput(false);
    sheet(h('div', { class: 'request photo-tool' }, top(),
      h('p', { class: 'note', text: s.intro }),
      h('p', { class: 'trust', text: s.private }),
      h('button', { class: 'btn primary wide big', type: 'button', text: s.camera, onclick: () => cam.click() }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.gallery, onclick: () => gal.click() }),
      cam, gal,
      h('p', { class: 'qlabel', text: s.tipsTitle }),
      h('ul', { class: 'docs' }, s.tips.map((x) => h('li', { text: x }))),
      h('p', { class: 'notice', text: s.german })), { tall: true });
  }

  async function run(file) {
    const msg = h('p', { class: 'note', text: models ? s.working : s.loadingFirst });
    sheet(h('div', { class: 'request photo-tool' }, top(), h('div', { class: 'photo-wait' }, h('div', { class: 'spin' }), msg)), { tall: true });
    let a;
    try {
      if (!models) { await loadModels(); msg.textContent = s.working; }
      a = await analyse(file);
    } catch (e) {
      console.error(e);
      const tgt = e && e.target;
      let why = String((e && e.message) || (e && e.type ? `${e.type} ${(tgt && (tgt.src || tgt.currentSrc)) || ''}` : e) || '').slice(0, 160);
      // What security policy does the server send right now? (helps find caching problems)
      try { const r = await fetch('/', { cache: 'no-store' }); const csp = r.headers.get('content-security-policy') || ''; why += ` | csp:${/wasm-unsafe-eval/.test(csp) ? 'ok' : 'old'}`; } catch (e2) { /* offline */ }
      count && count('photo_error', { why });
      return result(null, s.failed + (why ? `\n(${why})` : ''));
    }
    if (a.error) { count && count('photo_noface'); return result(null, s[a.error]); }
    count && count('photo_done');
    result(a);
  }

  function result(a, error) {
    if (!a) {
      sheet(h('div', { class: 'request photo-tool' }, top(), h('p', { class: 'notice', text: error }),
        h('button', { class: 'btn primary wide big', type: 'button', text: s.retake, onclick: start })), { tall: true });
      return;
    }
    let zoom = 1; let shift = 0; let photo = drawPhoto(a);
    const img = h('img', { class: 'photo-prev', alt: s.title, width: PW, height: PH });
    const paint = () => { photo = drawPhoto(a, zoom, shift); img.src = photo.toDataURL('image/jpeg', 0.9); };
    paint();
    const slider = (label, min, max, val, on) => h('label', { class: 'photo-adj' }, h('span', { text: label }),
      h('input', { type: 'range', min, max, step: '0.01', value: val, oninput: (e) => { on(parseFloat(e.target.value)); paint(); } }));
    const warns = a.warn.length ? a.warn.map((k) => h('li', { text: s[k] })) : [h('li', { text: s.ok })];
    const canShare = !!(navigator.canShare && navigator.share);
    sheet(h('div', { class: 'request photo-tool' }, top(),
      h('div', { class: 'photo-frame' }, img),
      h('ul', { class: 'docs photo-warn' }, warns),
      slider(s.size, '0.85', '1.15', '1', (v) => { zoom = v; }),
      slider(s.move, '-1', '1', '0', (v) => { shift = -v; }),
      h('button', { class: 'btn primary wide big', type: 'button', text: s.sheetBtn,
        onclick: async () => { count && count('photo_sheet'); await download(drawSheet(photo, s.footer), 'photo-10x15.jpg'); toast && toast(s.saved); } }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.singleBtn,
        onclick: async () => { count && count('photo_single'); await download(photo, 'photo-35x45.jpg'); toast && toast(s.saved); } }),
      canShare ? h('button', { class: 'btn soft wide', type: 'button', text: s.share, onclick: async () => {
        try {
          const f = new File([await toBlob(drawSheet(photo, s.footer))], 'photo-10x15.jpg', { type: 'image/jpeg' });
          if (navigator.canShare({ files: [f] })) await navigator.share({ files: [f] });
        } catch (e) { /* cancelled */ }
      } }) : null,
      h('p', { class: 'hint', text: s.printHow }),
      h('p', { class: 'hint', text: s.check }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.retake, onclick: start })), { tall: true });
  }

  start();
}
