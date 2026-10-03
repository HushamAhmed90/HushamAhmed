// Shared by the customer page (track.html) and the admin page (admin.html).
// All case contents are encrypted here, in the browser, with AES-GCM.

const enc = new TextEncoder();
const dec = new TextDecoder();

export const b64u = {
  from(bytes) {
    let s = '';
    new Uint8Array(bytes).forEach((b) => { s += String.fromCharCode(b); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  to(str) {
    const s = atob(String(str).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(s, (c) => c.charCodeAt(0));
  },
};

export const randomB64 = (n) => b64u.from(crypto.getRandomValues(new Uint8Array(n)));

export async function sha256Hex(text) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const importKey = (raw, extractable = false) =>
  crypto.subtle.importKey('raw', b64u.to(raw), 'AES-GCM', extractable, ['encrypt', 'decrypt']);

async function seal(key, bytes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv); out.set(ct, 12);
  return out;
}
async function open(key, bytes) {
  const b = new Uint8Array(bytes);
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, key, b.slice(12)));
}
export const sealBytes = seal;
export const openBytes = open;
export const sealJSON = async (key, obj) => b64u.from(await seal(key, enc.encode(JSON.stringify(obj))));
export const openJSON = async (key, text) => JSON.parse(dec.decode(await open(key, b64u.to(text))));

// Admin wrap key: derived from the admin password, never leaves this device.
export async function deriveWrapKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 250000 },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// The link a customer opens: /track.html#ID.SECRET.KEY (the fragment never reaches a server).
export const caseLink = (id, s, k) => `${location.origin}/track.html#${id}.${s}.${k}`;
export const caseCode = (id) => `HA-${id.slice(0, 4)}-${id.slice(4, 7)}`;

// Kinds of work, each with its own stages. The last stage means "done".
export const KINDS = {
  record: {
    icon: '📝', title: 'صورة القيد وقيد 57',
    stages: ['الوكالة صدرت من القنصلية', 'وصلت للوكيل بالعراق', 'قيد الإنجاز بدائرة الأحوال', 'التصديق من وزارة الخارجية', 'إرسال الأوراق إليك', 'اكتملت'],
  },
  crim: {
    icon: '🔍', title: 'عدم المحكومية والجنسية',
    stages: ['الوكالة صدرت من القنصلية', 'وصلت للوكيل بالعراق', 'بمديرية تحقيق الأدلة الجنائية', 'صدرت الشهادة', 'التصديق من وزارة الخارجية', 'إرسال الأوراق إليك', 'اكتملت'],
  },
  life: {
    icon: '📄', title: 'شهادة الحياة',
    stages: ['صدرت من القنصلية', 'أُرسلت للعراق', 'قُدّمت لهيأة التقاعد', 'اكتملت'],
  },
  passport: {
    icon: '🛂', title: 'الجواز',
    stages: ['استلمنا الطلب', 'تم حجز الموعد', 'قيد الإنجاز', 'الجواز جاهز', 'اكتملت'],
  },
  general: {
    icon: '📁', title: 'معاملة',
    stages: ['الوكالة صدرت من القنصلية', 'وصلت للوكيل بالعراق', 'قيد الإنجاز', 'إرسال الأوراق إليك', 'اكتملت'],
  },
};

export const MONTHS = ['كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران', 'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول'];
export const fmtDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const nowY = new Date().getFullYear();
  return `${d} ${MONTHS[m - 1]}${y !== nowY ? ` ${y}` : ''}`;
};
export const todayISO = () => {
  const n = new Date(); const p = (x) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
};
export const isDone = (it) => it.stage >= it.stages.length - 1;

export function h(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid);
  return node;
}

// The timeline of one item, as shown to the customer (and previewed by the admin).
export function stepsList(it) {
  return h('ul', { class: 'steps' }, it.stages.slice(0, -1).map((label, i) => {
    const state = i < it.stage ? 'done' : i === it.stage ? 'now' : 'todo';
    const when = it.dates && it.dates[i] ? fmtDate(it.dates[i]) : '';
    return h('li', { class: isDone(it) ? 'done' : state }, h('i'), label, when ? h('em', { text: when }) : null);
  }));
}
export function statusPill(it) {
  if (isDone(it)) return h('span', { class: 'pill p-ok', text: '✓ اكتملت' });
  return h('span', { class: 'pill p-run', text: it.stages[it.stage] });
}

// Shrink a photo before it is encrypted and uploaded.
export async function shrinkImage(file, max = 1800, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', quality));
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

// Full-screen photo viewer with a download button.
export function viewer(url, name) {
  const close = () => { wrap.remove(); document.body.classList.remove('locked'); };
  const wrap = h('div', { class: 'viewer', onclick: (e) => { if (e.target === wrap) close(); } },
    h('img', { src: url, alt: name }),
    h('div', { class: 'viewer-bar' },
      h('a', { class: 'btn pri', href: url, download: `${name}.jpg`, text: '⬇ تنزيل' }),
      h('button', { class: 'btn ghost', type: 'button', text: 'إغلاق', onclick: close })));
  document.body.classList.add('locked');
  document.body.append(wrap);
}
