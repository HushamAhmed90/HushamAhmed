// Draws the printed application sheet on a canvas, laid out like the
// official printout: A4 page in CSS pixels (794 x 1123), light grey grid,
// Cairo type, text sitting on the bottom of each cell.
import { SHEET } from './schema.js';
import { qrText, qrMatrix } from './qr.js';

export const PAGE_W = 794;
export const PAGE_H = 1123;

const LEFT = 41.6;            // content box
const RIGHT = 753.7;
const WIDTH = RIGHT - LEFT;
const GRID = '#dddddd';
const INK = '#000000';
const CELL_FONT = 9.7;        // px, semibold
const LINE = 14;              // line height inside cells
const PAD_R = 5, PAD_L = 3, PAD_V = 4;
const LABEL_W = 86;

const font = (weight, size) => `${weight} ${size}px CairoSheet, Tahoma, 'Segoe UI', sans-serif`;

export async function sheetFontsReady() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load(font(400, 11), 'ا'),
    document.fonts.load(font(600, 10), 'ا'),
  ]);
}

export function drawSheet(canvas, { values, record, lang, emblem, scale = 2 }) {
  const T = SHEET[lang] || SHEET.Ara;
  canvas.width = Math.round(PAGE_W * scale);
  canvas.height = Math.round(PAGE_H * scale);
  const g = canvas.getContext('2d');
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, PAGE_W, PAGE_H);
  g.direction = 'rtl';
  g.textBaseline = 'middle';

  const say = (text, x, y, { size = 10.9, weight = 400, align = 'right', bold = false } = {}) => {
    if (!text) return;
    g.font = font(weight, size);
    g.textAlign = align;
    g.fillStyle = INK;
    g.fillText(text, x, y);
    if (bold) { g.lineWidth = 0.4; g.strokeStyle = INK; g.strokeText(text, x, y); }
  };

  // --- Header ---------------------------------------------------------
  T.head.forEach((line, i) => say(line, 635.5, 80.2 + i * 24.9, { size: 10.9, align: 'center' }));
  if (emblem && emblem.complete && emblem.naturalWidth) {
    const w = 114.5, h = w * emblem.naturalHeight / emblem.naturalWidth;
    g.drawImage(emblem, 341.7, 42.2, w, h);
  }
  say(T.title, 397, 169.8, { size: 10.85, align: 'center' });

  // --- QR ---------------------------------------------------------------
  const qr = qrMatrix(qrText(record));
  const qrSize = 171.5, cell = qrSize / qr.size, qx = 44.1, qy = 192.6;
  g.fillStyle = INK;
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.isDark(r, c)) g.fillRect(qx + c * cell, qy + r * cell, cell + 0.02, cell + 0.02);
    }
  }

  // --- Tables -----------------------------------------------------------
  const L = (k) => ({ t: T.l[k], label: true });
  const V = (k) => ({ t: values[k] || '' });
  const pair = (k) => [L(k), V(k)];

  const measure = (text) => { g.font = font(600, CELL_FONT); return g.measureText(text || '').width; };

  function wrap(text, max) {
    if (!text) return [''];
    g.font = font(600, CELL_FONT);
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const next = line ? line + ' ' + w : w;
      if (!line || g.measureText(next).width <= max) line = next;
      else { lines.push(line); line = w; }
    }
    lines.push(line);
    return lines;
  }

  // Column widths like an automatic HTML table: fixed label columns, the
  // rest shared in proportion to how much text each column holds.
  function columns(rows, width, fixedLabels) {
    const n = Math.max(...rows.map((r) => r.length));
    const natural = new Array(n).fill(9);
    const fixed = new Array(n).fill(false);
    rows.forEach((r) => r.forEach((c, i) => {
      natural[i] = Math.max(natural[i], measure(c.t) + PAD_R + PAD_L + 1);
      if (c.label && fixedLabels) fixed[i] = true;
    }));
    const fixedTotal = fixed.reduce((s, f) => s + (f ? LABEL_W : 0), 0);
    const autoTotal = natural.reduce((s, w, i) => s + (fixed[i] ? 0 : w), 0);
    const spare = width - fixedTotal;
    return natural.map((w, i) => (fixed[i] ? LABEL_W : spare * w / autoTotal));
  }

  function table(rows, { x, width, top, fixedLabels = true, dry = false }) {
    const cols = columns(rows, width, fixedLabels);
    let y = top;
    if (dry) {
      for (const row of rows) {
        const most = Math.max(...row.map((c, i) => wrap(c.t, cols[i] - PAD_R - PAD_L).length));
        y += most * LINE + PAD_V * 2 + 1;
      }
      return y - top;
    }
    g.lineWidth = 1;
    g.strokeStyle = GRID;
    for (const row of rows) {
      const lines = row.map((c, i) => wrap(c.t, cols[i] - PAD_R - PAD_L));
      const h = Math.max(...lines.map((l) => l.length)) * LINE + PAD_V * 2 + 1;
      let right = x + width;
      row.forEach((c, i) => {
        const w = cols[i];
        g.strokeStyle = GRID;
        g.strokeRect(right - w + 0.5, y + 0.5, w - 1 + 1, h - 1 + 1);
        const ls = lines[i];
        ls.forEach((line, j) => {
          const cy = y + h - PAD_V - 1 - LINE / 2 - (ls.length - 1 - j) * LINE;
          say(line, right - PAD_R - 0.5, cy, { size: CELL_FONT, weight: 600, bold: true });
        });
        right -= w;
      });
      y += h;
    }
    return y;
  }

  // Birth place/date: sits at the right, bottom aligned with the QR code.
  const birthRows = [pair('a04birthLoc'), pair('a05birthDate')];
  const birthH = table(birthRows, { x: RIGHT - 295, width: 295, top: 0, dry: true });
  table(birthRows, { x: RIGHT - 295, width: 295, top: 363.4 - birthH });

  let y = table([
    [...pair('a07name1'), ...pair('a06name2')],
    [...pair('a09name3'), ...pair('a08name4')],
    [...pair('a11motherName'), ...pair('a10motherFatherName')],
  ], { x: LEFT, width: WIDTH, top: 369.2 });

  say(T.sec[0], RIGHT, y + 8.9, { size: 13.6 });
  y = table([
    pair('a01gender'),
    [...pair('a33religion'), ...pair('a02mariage')],
    [...pair('a34job'), ...pair('a03bloodGroup')],
    [...pair('a35disabilities'), ...pair('a31passport')],
  ], { x: LEFT, width: WIDTH, top: y + 27.5 });

  say(T.sec[1], RIGHT, y + 9.9, { size: 13.6 });
  y = table([
    [...pair('a39addrCountry'), ...pair('a38addrProv'), ...pair('a37addrM'), ...pair('a36addrStNo')],
    [...pair('a42addrBuildingNo'), ...pair('a41addrOther'), ...pair('a40phone')],
  ], { x: LEFT, width: WIDTH, top: y + 27.5, fixedLabels: false });

  // Three side-by-side blocks.
  const colW = 234.8;
  const blocks = [
    { x: 517.6, title: T.sec[2], keys: ['a22addrOffice', 'a23addrFormNo', 'a24addrFromDate'] },
    { x: 280.2, title: T.sec[3], keys: ['a15shProv', 'a16shOffice', 'a17shNo', 'a18shDate', 'a19shPageNo', 'a20shYear', 'a21shLawItem'] },
    { x: 42.9, title: T.sec[4], keys: ['a12office', 'a13bookNo', 'a14pageNo'] },
  ];
  let lowest = y;
  for (const b of blocks) {
    say(b.title, b.x + colW, y + 21.7, { size: 13.6 });
    const bottom = table(b.keys.map((k) => pair(k)), { x: b.x, width: colW, top: y + 38.4 });
    lowest = Math.max(lowest, bottom);
  }

  say(T.sec[5], RIGHT, lowest + 21.7, { size: 13.6 });
  y = table([
    [...pair('a27fatherIsLive'), ...pair('a26fatherCountry'), ...pair('a25fatherBirthLoc')],
    [...pair('a30motherIsLive'), ...pair('a29motherCountry'), ...pair('a28motherBirthLoc')],
  ], { x: LEFT, width: WIDTH, top: lowest + 38.4 });

  const signY = Math.min(y + 66.6, PAGE_H - 30);
  [630, 397.3, 164.8].forEach((cx, i) => say(T.sign[i], cx, signY, { size: 9.9, align: 'center' }));

  return canvas;
}
