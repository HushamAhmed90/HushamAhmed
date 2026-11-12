// Iraqi visa application form for foreigners ("صحيفة أعمال الأجنبي لغرض طلب سمة الدخول").
// The two official pages are drawn as background images and the answers are
// written on top. Coordinates are in PDF points (A4: 595.28 x 841.89, origin top-left).

export const IV_PAGE_W = 794;
export const IV_PAGE_H = 1123;
const K = IV_PAGE_W / 595.276;

// Field groups shown in the app, in order. type: text | date | pick | long
export const IV_GROUPS = [
  ['me', ['name', 'gender', 'religion', 'natCur', 'natOrig', 'birthDate', 'birthCountry', 'jobCur', 'jobPrev', 'homeAddr', 'langs']],
  ['spouse', ['spName', 'spNat', 'spBirthPlace', 'spBirthDate', 'spJob', 'spWork']],
  ['pass', ['ppNo', 'ppCountry', 'ppIssue', 'ppExp', 'companions']],
  ['edu', ['cert', 'profession', 'certPlace', 'certDate']],
  ['trip', ['visaPlace', 'fromPlace', 'entryPoint', 'purpose', 'duration', 'iqAddr', 'iqWork', 'iqFirm']],
  ['past', ['prevCount', 'lastEntry', 'prevJob', 'prevPlaces', 'diplo', 'deported']],
  ['kids', ['k1n', 'k1b', 'k1j', 'k2n', 'k2b', 'k2j', 'k3n', 'k3b', 'k3j']],
  ['visited', ['c1n', 'c1k', 'c1d', 'c2n', 'c2k', 'c2d', 'c3n', 'c3k', 'c3d']],
  ['refs', ['r1n', 'r1nat', 'r1a', 'r2n', 'r2nat', 'r2a', 'r3n', 'r3nat', 'r3a']],
  ['sponsor', ['soName', 'soAddr', 'soJob']],
];
export const IV_DATES = ['birthDate', 'spBirthDate', 'ppIssue', 'ppExp', 'certDate', 'lastEntry', 'k1b', 'k2b', 'k3b', 'c1d', 'c2d', 'c3d'];
export const IV_REQUIRED = ['name', 'gender', 'natCur', 'birthDate', 'birthCountry', 'ppNo', 'ppCountry', 'ppIssue', 'ppExp', 'purpose', 'duration', 'iqAddr'];
// Rows that stay empty in the table groups when not used (no "لا يوجد" filling).
const TABLE = /^(k|c|r)\d/;

// Single-line fields: [page, right edge, left edge, bottom of the text row]
const BOX = {
  name: [1, 486, 106, 231], religion: [1, 322, 84, 249],
  natOrig: [1, 215, 117, 267], natCur: [1, 510, 405, 267],
  birthCountry: [1, 214, 117, 285], jobPrev: [1, 213, 118, 303], jobCur: [1, 511, 406, 303],
  homeAddr: [1, 512, 190, 321], langs: [1, 494, 136, 348],
  spName: [1, 501, 362, 393], spNat: [1, 205, 82, 393], spJob: [1, 205, 82, 411], spWork: [1, 483, 154, 429],
  spBirthPlace: [1, 501, 458, 411],
  ppNo: [1, 502, 378, 474], ppCountry: [1, 214, 100, 474], companions: [1, 483, 126, 510],
  cert: [1, 501, 378, 555], profession: [1, 222, 100, 555], certPlace: [1, 501, 134, 573],
  visaPlace: [1, 493, 117, 636], fromPlace: [1, 492, 118, 654], entryPoint: [1, 492, 120, 672],
  purpose: [1, 493, 135, 690], duration: [1, 476, 173, 708],
  iqAddr: [1, 447, 161, 753], iqWork: [1, 448, 181, 771], iqFirm: [1, 448, 161, 789],
  prevCount: [2, 448, 179, 51], prevJob: [2, 448, 144, 87], prevPlaces: [2, 423, 180, 105],
  diplo: [2, 565, 32, 138], deported: [2, 450, 234, 159],
  soName: [2, 538, 232, 609], soAddr: [2, 475, 232, 627], soJob: [2, 539, 232, 663],
};
// Dates: [page, day centre, month centre, year centre, bottom]
const DATE = {
  birthDate: [1, 499, 462, 424, 285], spBirthDate: [1, 444, 412, 377, 411],
  ppIssue: [1, 489, 450, 404, 492], ppExp: [1, 199, 162, 123, 492], certDate: [1, 380, 314, 220, 591],
  lastEntry: [2, 405, 336, 253, 69],
};
const ROWS = [245, 263, 281];      // children rows (page 2)
const CROWS = [371, 389, 407];     // countries rows
const RROWS = [497, 515, 533];     // references rows
ROWS.forEach((y, i) => { const n = i + 1;
  BOX[`k${n}n`] = [2, 560, 440, y]; BOX[`k${n}j`] = [2, 330, 32, y]; DATE[`k${n}b`] = [2, 427, 395, 364, y]; });
CROWS.forEach((y, i) => { const n = i + 1;
  BOX[`c${n}n`] = [2, 560, 380, y]; BOX[`c${n}k`] = [2, 370, 205, y]; DATE[`c${n}d`] = [2, 170, 124, 70, y]; });
RROWS.forEach((y, i) => { const n = i + 1;
  BOX[`r${n}n`] = [2, 560, 385, y]; BOX[`r${n}nat`] = [2, 380, 265, y]; BOX[`r${n}a`] = [2, 258, 32, y]; });
const SIGN = [2, 293, 269, 245, 795];      // applicant date
const SO_SIGN = [2, 128, 102, 70, 642];    // sponsor date

const font = (size) => `600 ${size}px CairoSheet, Tahoma, 'Segoe UI', sans-serif`;
const NONE = 'لا يوجد';

export function ivValue(v, k, fillNone) {
  const s = String(v[k] || '').trim();
  if (s) return s;
  if (!fillNone || TABLE.test(k) || /^so/.test(k) || k === 'gender' || IV_DATES.includes(k)) return '';
  return NONE;
}

// Draws one page (1 or 2). bg is a loaded <img> of the blank page.
export function drawIvPage(canvas, page, v, bg, { scale = 2, fillNone = true, today = new Date() } = {}) {
  canvas.width = Math.round(IV_PAGE_W * scale);
  canvas.height = Math.round(IV_PAGE_H * scale);
  const g = canvas.getContext('2d');
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.fillStyle = '#fff'; g.fillRect(0, 0, IV_PAGE_W, IV_PAGE_H);
  if (bg && bg.naturalWidth) g.drawImage(bg, 0, 0, IV_PAGE_W, IV_PAGE_H);
  if (page === 2) { g.fillStyle = '#fff'; g.fillRect(190 * K, 806 * K, 195 * K, 24 * K); } // leftover print buttons
  g.fillStyle = '#0b2a8a';
  g.textBaseline = 'alphabetic';

  const fit = (text, right, left, bottom) => {
    const max = (right - left - 4) * K;
    let size = 11.5;
    g.font = font(size);
    while (g.measureText(text).width > max && size > 6.5) { size -= 0.5; g.font = font(size); }
    let s = text;
    while (g.measureText(s).width > max && s.length > 1) s = s.slice(0, -1);
    g.direction = /[؀-ۿ]/.test(s) ? 'rtl' : 'ltr';
    g.textAlign = 'right';
    g.fillText(s, (right - 2) * K, (bottom - 1.2) * K);
  };
  const dateAt = (iso, [, d, m, y, bottom]) => {
    const p = String(iso || '').split('-');
    if (p.length !== 3) return;
    g.font = font(11); g.direction = 'ltr'; g.textAlign = 'center';
    g.fillText(p[2], d * K, (bottom - 1.2) * K); g.fillText(p[1], m * K, (bottom - 1.2) * K); g.fillText(p[0], y * K, (bottom - 1.2) * K);
  };

  for (const [k, box] of Object.entries(BOX)) {
    if (box[0] !== page) continue;
    const s = ivValue(v, k, fillNone);
    if (s) fit(s, box[1], box[2], box[3]);
  }
  for (const [k, box] of Object.entries(DATE)) if (box[0] === page) dateAt(v[k], box);
  if (page === 1 && (v.gender === 'm' || v.gender === 'f')) {
    const x = v.gender === 'm' ? 420 : 502.5;
    g.beginPath(); g.arc(x * K, 243.5 * K, 3.2 * K, 0, Math.PI * 2); g.fill();
  }
  if (page === 2) {
    const iso = today.toISOString().slice(0, 10);
    dateAt(iso, SIGN);
    if (String(v.soName || '').trim()) dateAt(iso, SO_SIGN);
  }
  return canvas;
}
