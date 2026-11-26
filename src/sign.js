// Signature cleaner: photo of a signature on paper -> clean ink on white or transparent.
// Runs on the phone only; the picture is never uploaded.

const T = {
  Ara: {
    title: 'توقيعك بخلفية بيضاء',
    intro: 'وقّع على ورقة بيضاء بقلم غامق، وصوّرها. التطبيق يشيل الورقة والظل ويخلي التوقيع نظيف، حتى تحطه بالاستمارات والملفات.',
    private: '🔒 الصورة ما تطلع من موبايلك.',
    camera: '📷 صوّر التوقيع',
    gallery: '🖼️ اختار صورة من الموبايل',
    tips: 'صوّر بضوء زين وبدون ظل الموبايل، وقرّب حتى يملي التوقيع الصورة.',
    working: 'ننظف التوقيع…',
    strength: 'قوة التنظيف',
    ink: 'لون الحبر',
    rotate: '↻ تدوير',
    png: '⬇️ PNG شفاف (للملفات)',
    jpg: '⬇️ JPG بخلفية بيضاء',
    share: '📤 مشاركة',
    retake: '🔁 صورة ثانية',
    empty: 'ما لكينا توقيع واضح. جرب صورة أقرب وبضوء أحسن، أو قلّل قوة التنظيف.',
    error: 'صار خطأ بقراءة الصورة. جرب صورة ثانية.',
    note: 'استخدم توقيعك بس بملفاتك انت. الاستمارات اللي تنطلب بتوقيع حي لازم توقعها بإيدك.',
  },
  Kur: {
    title: 'واژووەکەت بە باکگراوندی سپی',
    intro: 'لەسەر پەڕەیەکی سپی بە پێنووسی تاریک واژوو بکە و وێنەی بگرە. بەرنامەکە پەڕە و سێبەرەکە لادەبات و واژووەکە پاک دەکاتەوە.',
    private: '🔒 وێنەکە لە مۆبایلەکەت دەرناچێت.',
    camera: '📷 وێنەی واژووەکە بگرە',
    gallery: '🖼️ وێنەیەک لە مۆبایل هەڵبژێرە',
    tips: 'بە ڕووناکی باش و بێ سێبەری مۆبایل وێنە بگرە، و نزیک بکەرەوە.',
    working: 'واژووەکە پاک دەکەینەوە…',
    strength: 'هێزی پاککردنەوە',
    ink: 'ڕەنگی مەرەکەب',
    rotate: '↻ سوڕاندن',
    png: '⬇️ PNGی ڕوون (بۆ فایل)',
    jpg: '⬇️ JPG بە باکگراوندی سپی',
    share: '📤 هاوبەشکردن',
    retake: '🔁 وێنەیەکی تر',
    empty: 'واژوویەکی ڕوون نەدۆزرایەوە. وێنەیەکی نزیکتر بە ڕووناکی باشتر تاقی بکەرەوە.',
    error: 'هەڵەیەک لە خوێندنەوەی وێنەکە ڕوویدا.',
    note: 'واژووەکەت تەنها لە فایلەکانی خۆتدا بەکاربهێنە.',
  },
};
const INKS = { black: [20, 20, 24], blue: [16, 46, 140], navy: [15, 40, 80] };

async function readImage(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = url; });
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}
function rotate90(c) {
  const o = document.createElement('canvas'); o.width = c.height; o.height = c.width;
  const x = o.getContext('2d'); x.translate(o.width, 0); x.rotate(Math.PI / 2); x.drawImage(c, 0, 0); return o;
}

// Ink mask: how much darker each pixel is than the local paper brightness (box blur via integral image).
function inkMask(src) {
  const w = src.width; const hh = src.height;
  const d = src.getContext('2d').getImageData(0, 0, w, hh).data;
  const g = new Float32Array(w * hh);
  for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
  const I = new Float64Array((w + 1) * (hh + 1));
  for (let y = 0; y < hh; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { row += g[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; }
  }
  const r = Math.max(8, Math.round(Math.max(w, hh) / 40));
  const diff = new Float32Array(w * hh);
  for (let y = 0; y < hh; y++) {
    const y0 = Math.max(0, y - r); const y1 = Math.min(hh, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r); const x1 = Math.min(w, x + r + 1);
      const sum = I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0];
      const bg = sum / ((y1 - y0) * (x1 - x0));
      diff[y * w + x] = Math.max(0, (bg - g[y * w + x]) / Math.max(40, bg));   // 0 = paper, ~0.5+ = ink
    }
  }
  return { w, h: hh, diff };
}
// strength 1..10 → threshold; returns a tight canvas with the ink in colour on transparent.
function renderInk(m, strength, rgb) {
  const lo = 0.30 - strength * 0.022; const hi = lo + 0.14;
  const { w, h: hh, diff } = m;
  const a = new Uint8ClampedArray(w * hh);
  let minX = w; let minY = hh; let maxX = -1; let maxY = -1;
  for (let y = 0; y < hh; y++) {
    for (let x = 0; x < w; x++) {
      const v = diff[y * w + x];
      const al = v <= lo ? 0 : v >= hi ? 255 : Math.round(((v - lo) / (hi - lo)) * 255);
      if (al > 0) {
        a[y * w + x] = al;
        if (al > 120) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
      }
    }
  }
  if (maxX < 0 || (maxX - minX) * (maxY - minY) < 200) return null;
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.06) + 6;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(hh - 1, maxY + pad);
  const cw = maxX - minX + 1; const ch = maxY - minY + 1;
  const out = document.createElement('canvas'); out.width = cw; out.height = ch;
  const ctx = out.getContext('2d'); const img = ctx.createImageData(cw, ch); const p = img.data;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const al = a[(y + minY) * w + x + minX]; const k = (y * cw + x) * 4;
      p[k] = rgb[0]; p[k + 1] = rgb[1]; p[k + 2] = rgb[2]; p[k + 3] = al;
    }
  }
  ctx.putImageData(img, 0, 0);
  return out;
}
function onWhite(c) {
  const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
  const x = o.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, o.width, o.height); x.drawImage(c, 0, 0); return o;
}
const toBlob = (c, type, q) => new Promise((ok) => c.toBlob(ok, type, q));

export function openSign({ h, sheet, closeSheet, lang, count, toast }) {
  const s = T[lang] || T.Ara;
  count && count('sign_open');
  const root = h('div', { class: 'request sign' });
  sheet(root, { tall: true });
  const show = (...kids) => { root.replaceChildren(...kids.flat().filter(Boolean)); };
  const top = () => h('div', { class: 'picker-top' }, h('h2', { text: s.title }), h('button', { class: 'x', type: 'button', 'aria-label': '✕', onclick: closeSheet, text: '✕' }));
  const input = (cap) => {
    const i = h('input', { type: 'file', accept: 'image/*', hidden: true });
    if (cap) i.setAttribute('capture', 'environment');
    i.addEventListener('change', () => { if (i.files && i.files[0]) work(i.files[0]); });
    return i;
  };

  function start() {
    const cam = input(true); const gal = input(false);
    show(top(), h('p', { class: 'note', text: s.intro }), h('p', { class: 'trust', text: s.private }), h('p', { class: 'hint', text: s.tips }),
      h('button', { class: 'btn primary wide big', type: 'button', text: s.camera, onclick: () => cam.click() }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.gallery, onclick: () => gal.click() }),
      h('p', { class: 'hint', text: s.note }), cam, gal);
  }

  async function work(file) {
    show(top(), h('div', { class: 'photo-wait' }, h('div', { class: 'spin' }), h('p', { class: 'note', text: s.working })));
    let src;
    try { src = await readImage(file); } catch (e) { toast && toast(s.error); return start(); }
    let mask = inkMask(src); let strength = 5; let ink = 'black'; let out = null;
    const prev = h('img', { class: 'sign-prev', alt: '' });
    const msg = h('p', { class: 'notice', hidden: true, text: s.empty });
    const btns = h('div', {});
    const paint = () => {
      out = renderInk(mask, strength, INKS[ink]);
      msg.hidden = !!out; prev.hidden = !out; btns.hidden = !out;
      if (out) prev.src = out.toDataURL('image/png');
    };
    const range = h('input', { class: 'sign-range', type: 'range', min: '1', max: '10', value: String(strength) });
    range.addEventListener('input', () => { strength = +range.value; paint(); });
    const inks = h('div', { class: 'sign-inks' }, Object.keys(INKS).map((k) => h('button', { type: 'button', class: `ink-${k}` + (k === ink ? ' on' : ''), 'aria-label': k, onclick: (e) => { ink = k; inks.querySelectorAll('button').forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); paint(); } })));
    const save = async (white) => {
      if (!out) return;
      const c = white ? onWhite(out) : out;
      const blob = await toBlob(c, white ? 'image/jpeg' : 'image/png', 0.95);
      const name = white ? 'توقيع.jpg' : 'توقيع.png';
      count && count('sign_save', { white });
      const u = URL.createObjectURL(blob); const a = h('a', { href: u, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 5000);
    };
    const share = async () => {
      if (!out) return;
      const f = new File([await toBlob(out, 'image/png')], 'توقيع.png', { type: 'image/png' });
      if (navigator.canShare && navigator.share && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); } catch (e) { /* cancelled */ } } else save(false);
    };
    btns.append(
      h('button', { class: 'btn primary wide big', type: 'button', text: s.png, onclick: () => save(false) }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.jpg, onclick: () => save(true) }),
      h('button', { class: 'btn soft wide', type: 'button', text: s.share, onclick: share }));
    show(top(), prev, msg,
      h('label', { class: 'qlabel', text: s.strength }), range,
      h('p', { class: 'qlabel', text: s.ink }), inks,
      h('button', { class: 'btn soft wide', type: 'button', text: s.rotate, onclick: () => { src = rotate90(src); mask = inkMask(src); paint(); } }),
      btns,
      h('button', { class: 'btn soft wide', type: 'button', text: s.retake, onclick: start }));
    paint();
    count && count(out ? 'sign_ok' : 'sign_empty');
  }
  start();
}
