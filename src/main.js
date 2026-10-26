import { LISTS } from './lists.js';
import { FIELDS, FIXED, SECTIONS, LABELS } from './schema.js';
import { UI, OWNER, SERVICES, NOTICES, IMPACT, OCCASIONS, VIDEOS, NEWS } from './texts.js';
import { drawSheet, sheetFontsReady } from './sheet.js';
import { jpegPagePdf } from './pdf.js';
import { MISSIONS, OWN_FORMS, NO_FORM, missionTitle, findMission } from './missions.js';
import { toLatin, hasArabic } from './translit.js';
import { GUIDES, findGuide } from './guides.js';
import { NATUR, NATUR_SOURCES, QUIZ, INTERVIEW } from './natur.js';
import { pushSupported, needsInstall, pushOn, enablePush, disablePush, refreshPushLang, scheduleReminder, cancelReminder } from './push.js';
import { FIELDS as C_FIELDS, POA_PURPOSES, REQUIRED as C_REQUIRED, MARITAL, drawConsular, consularFontsReady } from './consular.js';

const KEY = 'bitaqa.forms.v2';
const OLD_KEY = 'bitaqa.form.v1';
const $ = (sel, root = document) => root.querySelector(sel);

const app = {
  lang: null,
  forms: [],         // family: [{ id, values, open, spouseOf? }]
  current: null,     // id of the form being edited
  values: {},        // raw values of the current form (codes for pick fields)
  open: 'names',     // open section id
  review: false,
  section: 'home',   // 'home' | 'forms' | 'guide' | 'services'
  view: 'nid',       // 'nid' | 'consular'
  cReview: false,
};
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const currentForm = () => app.forms.find((f) => f.id === app.current);
function useForm(form) {
  app.current = form.id;
  app.values = form.values;
  app.open = form.open || 'names';
}
function addForm(values = {}, extra = {}) {
  const form = { id: newId(), values, open: 'names', ...extra };
  app.forms.push(form);
  useForm(form);
  return form;
}

// ---------- tiny DOM helper ----------
function h(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) node.append(kid);
  return node;
}

const ICON = {
  wa: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm4.6 14.1c-.2.6-1.2 1.1-1.7 1.2-.5.1-1.1.1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.6-1.1-4.3-3.8-4.4-4-.1-.2-1-1.4-1-2.6s.6-1.9.9-2.1c.2-.3.5-.3.6-.3h.5c.2 0 .4 0 .6.4l.8 1.9c.1.1.1.3 0 .4l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.8-1c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.5.3.1.2.1.7-.1 1.2z"/></svg>',
  fb: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg>',
  tt: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.3 6.2V8.6a7.7 7.7 0 0 0 4.4 1.4V6.7a4.4 4.4 0 0 1-4.4-4.4z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>',
};

const t = () => UI[app.lang];
// Vercel Web Analytics (Pro) keeps at most 2 properties per event, so the
// event's own details go first and the language only fills a free slot.
const count = (name, data) => {
  try {
    const props = Object.entries({ ...(data || {}), lang: app.lang || '' }).filter(([, v]) => v !== '' && v != null).slice(0, 2);
    if (window.va) window.va('event', { name, data: Object.fromEntries(props) });
  } catch (e) { /* ignore */ }
};
const waLink = (msg) => `https://wa.me/${OWNER.whatsapp}?text=${encodeURIComponent(msg)}`;

// ---------- values ----------
const latinDigits = (s) => s.replace(/[\u0660-\u0669]/g, (d) => d.charCodeAt(0) - 0x660)
  .replace(/[\u06F0-\u06F9]/g, (d) => d.charCodeAt(0) - 0x6F0);
const clean = (s) => latinDigits(String(s)).replace(/,/g, '\u060C').replace(/[\r\n]+/g, ' ');

function listFor(key) {
  const src = FIELDS[key].list;
  if (src.startsWith('opt:')) return LISTS.options[app.lang][src.slice(4)] || LISTS.options.Ara[src.slice(4)];
  return LISTS[src];
}
const labelOf = (key, code) => {
  const hit = listFor(key).find((row) => row[0] === String(code));
  return hit ? hit[1] : '';
};
function displayValues() {
  const out = {};
  for (const [k, f] of Object.entries(FIELDS)) {
    const v = app.values[k];
    if (!v) continue;
    // Like the official printout, marital status and blood group print their stored value.
    out[k] = f.type === 'pick' && !PRINT_RAW.has(k) ? labelOf(k, v) : v;
  }
  return out;
}
const PRINT_RAW = new Set(['a02mariage', 'a03bloodGroup']);
const record = () => ({ ...FIXED, ...app.values });

const missingIn = (sec) => sec.keys.filter((k) => FIELDS[k].req && !app.values[k]);
const filledIn = (sec) => sec.keys.filter((k) => app.values[k]).length;

function persist() {
  const cur = currentForm();
  if (cur) { cur.values = app.values; cur.open = app.open; }
  try { localStorage.setItem(KEY, JSON.stringify({ lang: app.lang, forms: app.forms, current: app.current })); } catch (e) { /* private mode */ }
}
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) return saved;
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');   // single-form version
    if (!old) return null;
    const id = newId();
    return { lang: old.lang, forms: [{ id, values: old.values || {}, open: old.open || 'names' }], current: id };
  } catch (e) { return null; }
}
const hasData = (saved) => saved && (saved.forms || []).some((f) => Object.keys(f.values || {}).length);
function loadSaved(saved) {
  app.forms = (saved && saved.forms && saved.forms.length) ? saved.forms : [];
  const cur = app.forms.find((f) => f.id === (saved && saved.current)) || app.forms[0];
  if (cur) useForm(cur); else addForm();
}
function resetAll() {
  app.forms = [];
  addForm();
  persist();
}

// ---------- family ----------
const ADDRESS = ['a39addrCountry', 'a38addrProv', 'a37addrM', 'a36addrStNo', 'a42addrBuildingNo', 'a41addrOther', 'a22addrOffice'];
const personName = (values) => [values.a07name1, values.a06name2].filter(Boolean).join(' ') || t().unnamed;
const formMissing = (values) => Object.entries(FIELDS).filter(([k, f]) => f.req && !values[k]).length;
const copyKeys = (from, to, keys) => keys.forEach((k) => { if (from[k]) to[k] = from[k]; });
const partnerOf = (form) => app.forms.find((f) => f.spouseOf === form.id) || app.forms.find((f) => f.id === form.spouseOf);

function childOf(parent) {
  const p = parent.values;
  const partner = partnerOf(parent);
  const isMother = p.a01gender === 'f';
  const father = isMother ? (partner ? partner.values : {}) : p;
  const mother = isMother ? p : (partner ? partner.values : {});
  const v = {};
  if (father.a07name1) v.a06name2 = father.a07name1;
  if (father.a06name2) v.a09name3 = father.a06name2;
  if (father.a08name4) v.a08name4 = father.a08name4;
  if (mother.a07name1) v.a11motherName = mother.a07name1;
  if (mother.a06name2) v.a10motherFatherName = mother.a06name2;
  copyKeys(p, v, ['a33religion', 'a12office', 'a13bookNo', 'a14pageNo', 'a40phone', ...ADDRESS]);
  v.a27fatherIsLive = '1';
  v.a30motherIsLive = '1';
  const single = LISTS.options[app.lang].mariageStatus[0];
  if (single) v.a02mariage = single[0];
  return v;
}
function spouseOf(person) {
  const p = person.values;
  const v = {};
  copyKeys(p, v, ['a33religion', 'a40phone', ...ADDRESS]);
  if (p.a01gender === 'm') v.a01gender = 'f';
  else if (p.a01gender === 'f') v.a01gender = 'm';
  const married = LISTS.options[app.lang].mariageStatus[1];
  v.a02mariage = p.a02mariage || (married && married[0]);
  return v;
}

function openFamily() {
  const u = t();
  const cur = currentForm();
  const row = (form) => {
    const miss = formMissing(form.values);
    const on = form.id === app.current;
    return h('div', { class: 'fam-row' + (on ? ' on' : '') },
      h('button', { class: 'fam-pick', type: 'button', onclick: () => { persist(); useForm(form); persist(); closeSheet(); app.review = false; renderForm(); scrollTo(0, 0); } },
        h('span', { class: 'fam-dot' + (miss ? '' : ' ok'), html: miss ? '' : ICON.check }),
        h('span', { class: 'fam-name' }, h('b', { text: personName(form.values) }), h('small', { text: miss ? `${u.formMissing} (${miss})` : u.formDone }))),
      app.forms.length > 1 ? h('button', { class: 'fam-del', type: 'button', 'aria-label': u.remove, text: '✕', onclick: () => {
        if (!confirm(u.confirmRemove(personName(form.values)))) return;
        app.forms = app.forms.filter((f) => f.id !== form.id);
        app.forms.forEach((f) => { if (f.spouseOf === form.id) delete f.spouseOf; if (f.childOf === form.id) delete f.childOf; });
        if (form.id === app.current) useForm(app.forms[0]);
        persist(); closeSheet(); renderForm(); openFamily();
      } }) : null);
  };
  const add = (label, note, make, type) => h('button', { class: 'fam-add', type: 'button', onclick: () => {
    persist();
    const made = make();
    addForm(made.values, made.extra);
    persist(); closeSheet(); app.review = false; renderForm(); scrollTo(0, 0);
    toast(u.added); count('family_add', { type });
  } }, h('b', { text: '+ ' + label }), note ? h('small', { text: note }) : null);

  // Children are added to the parents' family, not to the child.
  const base = (cur.childOf && app.forms.find((f) => f.id === cur.childOf)) || cur;
  const name = personName(base.values);
  sheet(h('div', { class: 'family' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.familyTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'note', text: u.familyNote }),
    h('div', { class: 'fam-list' }, app.forms.map(row)),
    add(u.addChild(name), u.childNote, () => ({ values: childOf(base), extra: { childOf: base.id } }), 'child'),
    partnerOf(base) ? null : add(u.addSpouse(name), u.spouseNote, () => ({ values: spouseOf(base), extra: { spouseOf: base.id } }), 'spouse'),
    add(u.addEmpty, null, () => ({ values: {} }), 'empty'),
    h('button', { class: 'btn ghost wide wipe', type: 'button', text: u.wipe, onclick: () => {
      if (!confirm(u.confirmWipe)) return;
      try { [KEY, OLD_KEY, REQ_KEY].forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
      app.forms = []; addForm(); persist();
      closeSheet(); app.review = false; renderForm(); scrollTo(0, 0); toast(u.wiped);
    } }),
  ), { tall: app.forms.length > 3 });
}

// ---------- service request (booking / lawyer) ----------
const REQ_KEY = 'bitaqa.request.v1';
function openRequest(preselect, prefillNote) {
  const u = t();
  let last = {};
  try { last = JSON.parse(localStorage.getItem(REQ_KEY) || '{}'); } catch (e) { /* ignore */ }
  const chosen = new Set(preselect ? [preselect] : []);
  let people = 1;
  let when = u.reqTimes.length - 1;

  const chips = h('div', { class: 'chips' }, SERVICES.map((sv) => {
    const b = h('button', { class: 'chipbtn' + (chosen.has(sv.id) ? ' on' : ''), type: 'button', 'aria-pressed': String(chosen.has(sv.id)),
      text: app.lang === 'Kur' ? sv.ku : sv.ar });
    b.addEventListener('click', () => {
      if (chosen.has(sv.id)) chosen.delete(sv.id); else chosen.add(sv.id);
      b.classList.toggle('on', chosen.has(sv.id)); b.setAttribute('aria-pressed', String(chosen.has(sv.id)));
      err.textContent = '';
    });
    return b;
  }));
  const err = h('p', { class: 'err' });
  const guess = personName(app.values);
  const name = h('input', { class: 'input', id: 'rq_name', value: last.name || (guess !== t().unnamed ? guess : ''), autocomplete: 'name' });
  const city = h('input', { class: 'input', id: 'rq_city', value: last.city || '', placeholder: u.reqCityHint, autocomplete: 'address-level2' });
  const countOut = h('b', { class: 'count', text: '1' });
  const step = (d) => { people = Math.min(20, Math.max(1, people + d)); countOut.textContent = String(people); };
  const times = h('div', { class: 'chips' }, u.reqTimes.map((label, i) => {
    const b = h('button', { class: 'chipbtn' + (i === when ? ' on' : ''), type: 'button', text: label });
    b.addEventListener('click', () => { when = i; [...times.children].forEach((c, j) => c.classList.toggle('on', j === i)); });
    return b;
  }));
  const notes = h('textarea', { class: 'input area', id: 'rq_notes', rows: 3 });
  if (prefillNote) notes.value = prefillNote;

  const send = () => {
    if (!chosen.size) { err.textContent = u.reqPickOne; chips.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!name.value.trim()) { name.focus(); name.classList.add('badin'); return; }
    const picked = SERVICES.filter((sv) => chosen.has(sv.id));
    const lines = [
      'مرحباً هشام، أريد تقديم طلب:',
      `• المعاملة: ${picked.map((sv) => sv.ar).join('، ')}`,
      `• الاسم: ${name.value.trim()}`,
      city.value.trim() ? `• المدينة: ${city.value.trim()}` : null,
      `• عدد الأشخاص: ${people}`,
      `• أفضل وقت للتواصل: ${UI.Ara.reqTimes[when]}`,
      notes.value.trim() ? `• ملاحظات: ${notes.value.trim()}` : null,
      '(مرسل من برنامج هشام للمعاملات)',
    ].filter(Boolean);
    try { localStorage.setItem(REQ_KEY, JSON.stringify({ name: name.value.trim(), city: city.value.trim() })); } catch (e) { /* ignore */ }
    count('booking_request', { services: picked.map((sv) => sv.id).join(','), people });
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
    closeSheet();
  };

  sheet(h('div', { class: 'request' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.reqTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'trust', html: ICON.check }, u.noUpfront),
    h('p', { class: 'note', text: u.reqNote }),
    h('p', { class: 'qlabel', text: u.reqWhat }), chips, err,
    h('div', { class: 'field' }, h('label', { for: 'rq_name' }, u.reqName, h('span', { class: 'req', text: ' *' })), name),
    h('div', { class: 'field' }, h('label', { for: 'rq_city', text: u.reqCity }), city),
    h('div', { class: 'field' }, h('label', { text: u.reqCount }),
      h('div', { class: 'stepper' },
        h('button', { class: 'stepbtn', type: 'button', 'aria-label': '+', text: '+', onclick: () => step(1) }),
        countOut,
        h('button', { class: 'stepbtn', type: 'button', 'aria-label': '-', text: '−', onclick: () => step(-1) }))),
    h('div', { class: 'field' }, h('label', { text: u.reqTime }), times),
    h('div', { class: 'field' }, h('label', { for: 'rq_notes', text: u.reqNotes }), notes),
    h('button', { class: 'btn wa wide big', type: 'button', html: ICON.wa, onclick: send }, u.reqSend),
  ), { tall: true });
  count('booking_open', { from: preselect || 'button' });
}

// ---------- save contact / share ----------
async function saveContact() {
  let photo = '';
  try {
    const buf = new Uint8Array(await (await fetch(OWNER.photo)).arrayBuffer());
    let bin = '';
    buf.forEach((b) => { bin += String.fromCharCode(b); });
    photo = `PHOTO;ENCODING=b;TYPE=JPEG:${btoa(bin)}`;
  } catch (e) { /* card without photo */ }
  const name = OWNER.name.Ara.split(' ');
  const card = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `N:${name.slice(1).join(' ')};${name[0]};;;`, `FN:${OWNER.name.Ara}`,
    `TEL;TYPE=CELL:+${OWNER.whatsapp}`,
    `NOTE:${UI.Ara.contactNote}`,
    `URL:${location.origin}`,
    photo, 'END:VCARD',
  ].filter(Boolean).join('\r\n');
  await hand(new Blob([card], { type: 'text/vcard' }), 'husham-ahmed.vcf');
  count('contact_saved');
}
async function shareApp() {
  const text = t().shareText;
  const url = location.origin;
  count('app_shared');
  if (navigator.share) {
    try { await navigator.share({ title: t().appName, text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank', 'noopener');
}

// ---------- share the finished form as a PDF (WhatsApp, e-mail, ...) ----------
async function shareFile(blob, name, place) {
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); count('form_shared', { place, how: 'share' }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  // No file sharing here (most computers): save it so it can be attached.
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(t().shareFallback, 5000);
  count('form_shared', { place, how: 'download' });
  return true;
}
async function sharePdf(btn, paintFn, name, place) {
  if (busy) return;
  busy = true;
  const label = btn.textContent;
  btn.textContent = t().preparing; btn.disabled = true;
  try {
    const big = await paintFn(2.5);
    const jpg = await new Promise((res) => big.toBlob(res, 'image/jpeg', 0.92));
    const pdf = jpegPagePdf(new Uint8Array(await jpg.arrayBuffer()), big.width, big.height);
    if (await shareFile(pdf, name, place)) afterDone(place === 'nid' ? 'nid' : cState.form);
  } catch (e) { console.error(e); toast(t().failed); }
  finally { busy = false; btn.textContent = label; btn.disabled = false; }
}

// ---------- "I finished" picture to share (WhatsApp status, TikTok, Instagram) ----------
// Shown once every few days after a form is saved, printed or shared. The picture has
// no personal data, only what was done and the app's address.
const BRAG_KEY = 'bitaqa.brag';
function afterDone(kind) {
  let last = 0;
  try { last = Number(localStorage.getItem(BRAG_KEY)) || 0; } catch (e) { /* ignore */ }
  if (Date.now() - last < 3 * 864e5) { askRating(); return; }
  try { localStorage.setItem(BRAG_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  setTimeout(() => showBrag(kind), 1200);
}
function bragWhat(kind) {
  const u = t();
  if (kind === 'nid') return u.bragNid;
  if (kind === 'apostille') return u.cForms.apostille;
  return u.bragForm(u.cForms[kind] || '');
}
function wrapLines(ctx, text, max) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
async function drawBrag(kind) {
  const u = t();
  const W = 1080; const H = 1920;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  await Promise.all([document.fonts.load('700 80px CairoSheet'), document.fonts.load('400 40px CairoSheet')]).catch(() => {});
  const g = x.createRadialGradient(W * 0.6, H * 0.3, 50, W * 0.5, H * 0.5, H * 0.8);
  g.addColorStop(0, '#24527f'); g.addColorStop(0.55, '#123150'); g.addColorStop(1, '#0b2238');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.direction = 'rtl'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const font = (w, px) => `${w} ${px}px CairoSheet, system-ui, sans-serif`;
  // app icon and name
  const icon = new Image(); icon.src = '/icons/icon-192.png';
  try {
    await icon.decode();
    x.save(); x.beginPath(); x.roundRect(W / 2 - 80, 170, 160, 160, 36); x.clip(); x.drawImage(icon, W / 2 - 80, 170, 160, 160); x.restore();
  } catch (e) { /* no icon */ }
  x.fillStyle = '#fff'; x.font = font(700, 60); x.fillText(u.appName, W / 2, 400);
  // gold tick
  x.fillStyle = '#d6a93a'; x.beginPath(); x.arc(W / 2, 640, 140, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#123150'; x.lineWidth = 34; x.lineCap = 'round'; x.lineJoin = 'round';
  x.beginPath(); x.moveTo(W / 2 - 62, 645); x.lineTo(W / 2 - 15, 695); x.lineTo(W / 2 + 70, 590); x.stroke();
  // what was done
  let y = 880;
  x.fillStyle = '#f0c35a'; x.font = font(700, 100); x.fillText(u.bragDone, W / 2, y); y += 130;
  x.fillStyle = '#fff'; x.font = font(700, 84);
  for (const l of wrapLines(x, bragWhat(kind), W - 160)) { x.fillText(l, W / 2, y); y += 112; }
  x.fillStyle = '#dbe6f2'; x.font = font(400, 54); x.fillText(u.bragFast, W / 2, y + 10); y += 110;
  const f = kind === 'nid' ? currentForm() : null;
  if (f && f.scanned) {
    x.font = font(400, 46);
    for (const l of wrapLines(x, u.bragScan, W - 200)) { x.fillText(l, W / 2, y); y += 66; }
  }
  // bottom panel
  x.fillStyle = '#fff'; x.beginPath(); x.roundRect(60, 1440, W - 120, 380, 48); x.fill();
  x.fillStyle = '#123150'; x.font = font(700, 54); x.fillText(u.bragFree, W / 2, 1530);
  x.fillStyle = '#4c5d70'; x.font = font(400, 44); x.fillText(u.bragTry, W / 2, 1620);
  x.fillStyle = '#123150'; x.font = font(700, 58); x.direction = 'ltr'; x.fillText(location.host, W / 2, 1700);
  x.fillStyle = '#4c5d70'; x.font = font(400, 40); x.fillText('▶ Google Play', W / 2, 1775);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
async function showBrag(kind) {
  if ($('#veil')) return;
  const u = t();
  count('brag_shown', { kind });
  let blob;
  try { blob = await drawBrag(kind); } catch (e) { askRating(); return; }
  const url = URL.createObjectURL(blob);
  const text = `${u.bragMsg(bragWhat(kind))}\n${location.origin}`;
  sheet(h('div', { class: 'brag' },
    h('h2', { text: u.bragTitle }),
    h('p', { class: 'note', text: u.bragText }),
    h('img', { class: 'brag-prev', src: url, alt: '' }),
    h('button', { class: 'btn primary wide', type: 'button', text: u.bragShare, onclick: async () => {
      const file = new File([blob], 'hesham-app.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); count('brag_shared', { kind, how: 'share' }); closeSheet(); return; }
        catch (e) { if (e.name === 'AbortError') return; }
      }
      const a = h('a', { href: url, download: 'hesham-app.png' });
      document.body.append(a); a.click(); a.remove();
      toast(t().shareFallback, 5000);
      count('brag_shared', { kind, how: 'download' });
    } }),
    h('a', { class: 'btn wa wide', href: `https://wa.me/?text=${encodeURIComponent(text)}`, target: '_blank', rel: 'noopener', html: ICON.wa, onclick: () => count('brag_shared', { kind, how: 'wa' }) }, u.bragWa),
    h('button', { class: 'btn ghost wide', type: 'button', text: u.bragLater, onclick: closeSheet })),
  { tall: true, onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1000) });
}

// ---------- "did the app help you?" (asked once, after saving) ----------
const RATE_KEY = 'bitaqa.rating.v1';
function askRating() {
  let st = {};
  try { st = JSON.parse(localStorage.getItem(RATE_KEY) || '{}'); } catch (e) { /* ignore */ }
  if (st.stars || (st.later && Date.now() - st.later < 7 * 864e5)) return;
  setTimeout(showRating, 1500);
}
function showRating() {
  if ($('#veil')) return;
  const tst = $('#toast'); if (tst) tst.classList.remove('show');
  const u = t();
  const keep = (x) => { try { localStorage.setItem(RATE_KEY, JSON.stringify(x)); } catch (e) { /* ignore */ } };
  let rated = false;
  const after = h('div', { class: 'rate-after' });
  const later = h('button', { class: 'btn ghost wide', type: 'button', text: u.rateLater, onclick: closeSheet });
  const chosen = (n) => {
    rated = true;
    keep({ stars: n });
    count(`rating_${n}`, { stars: n });   // one event per score, so the list shows it directly
    [...stars.children].forEach((b, i) => { b.classList.toggle('on', i < n); b.setAttribute('aria-pressed', String(i === n - 1)); });
    after.replaceChildren(...(n === 5 ? [
      h('p', { class: 'note', text: u.rateThanks }),
      isAndroid() ? h('a', { class: 'btn primary wide', href: PLAY_URL, target: '_blank', rel: 'noopener', onclick: () => count('rate_play', { place: 'rating' }) }, u.ratePlay) : null,
      h('button', { class: 'btn ' + (isAndroid() ? 'soft' : 'primary') + ' wide', type: 'button', text: u.shareApp, onclick: () => { closeSheet(); shareApp(); } }),
      h('a', { class: 'btn tt wide', href: OWNER.tiktok, target: '_blank', rel: 'noopener', html: ICON.tt, onclick: () => count('tiktok_click', { place: 'rating' }) }, u.followTiktok),
    ] : [
      h('p', { class: 'note', text: u.rateSorry }),
      h('a', { class: 'btn wa wide', href: waLink(UI.Ara.rateMsg(n)), target: '_blank', rel: 'noopener', html: ICON.wa, onclick: () => { count('whatsapp_click', { place: 'rating' }); closeSheet(); } }, u.rateTell),
    ]));
    later.textContent = u.close;
  };
  const stars = h('div', { class: 'stars', role: 'group', 'aria-label': u.rateTitle },
    [1, 2, 3, 4, 5].map((n) => h('button', { class: 'star', type: 'button', 'aria-label': `${n} / 5`, 'aria-pressed': 'false', text: '★', onclick: () => chosen(n) })));
  sheet(h('div', { class: 'msg rate' }, h('h2', { text: u.rateTitle }), h('p', { text: u.rateNote }), stars, after, later),
    { onClose: () => { if (!rated) keep({ later: Date.now() }); } });
}

// ---------- checks for common mistakes before printing ----------
function dateIssue(v, label, u, birth) {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d)) return null;
  if (d > new Date()) return u.wFuture(label);
  if (d.getFullYear() < 1900) return u.wOld(label);
  if (birth && v < birth) return u.wBeforeBirth(label);
  return null;
}
function phoneIssue(v, u) {
  const d = latinDigits(String(v || '')).replace(/\D/g, '');
  if (!d) return null;
  if (/^07/.test(d) && d.length !== 11) return u.wPhoneIraq;
  if (d.length < 9) return u.wPhoneShort;
  if (d.length > 15) return u.wPhoneLong;
  return null;
}
const sameText = (a, b) => a && b && a.trim() === b.trim();
function nidWarnings() {
  const u = t();
  const v = app.values;
  const L = LABELS[app.lang];
  const out = [];
  const add = (key, msg) => { if (msg) out.push({ key, msg }); };
  ['a07name1', 'a06name2', 'a09name3', 'a08name4', 'a11motherName', 'a10motherFatherName', 'a04birthLoc'].forEach((k) => {
    if (!v[k]) return;
    if (/\d/.test(latinDigits(v[k]))) add(k, u.wDigits(L[k]));
    else if (/[a-z]/i.test(v[k])) add(k, u.wLatin(L[k]));
  });
  if (sameText(v.a07name1, v.a06name2)) add('a06name2', u.wSameName);
  if (sameText(v.a06name2, v.a09name3)) add('a09name3', u.wSameFather);
  add('a05birthDate', dateIssue(v.a05birthDate, L.a05birthDate, u));
  add('a40phone', phoneIssue(v.a40phone, u));
  add('a18shDate', dateIssue(v.a18shDate, L.a18shDate, u, v.a05birthDate));
  if (v.a20shYear) {
    const y = +latinDigits(String(v.a20shYear));
    if (!(y >= 1900 && y <= new Date().getFullYear())) add('a20shYear', u.wYear(L.a20shYear));
  }
  add('a24addrFromDate', dateIssue(v.a24addrFromDate, L.a24addrFromDate, u, v.a05birthDate));
  return out;
}
function cWarnings() {
  const u = t();
  const v = cState.values;
  const L = u.cLabels;
  const out = [];
  // Only fields that are on screen for this form.
  const add = (key, msg) => { if (msg && document.querySelector(`[data-c="${key}"]`)) out.push({ key, msg }); };
  ['principal', 'mother', 'agent', 'child', 'spouse'].forEach((k) => { if (v[k] && /\d/.test(latinDigits(v[k]))) add(k, u.wDigits(L[k])); });
  ['latinName', 'firstName', 'lastName', 'street', 'plzCity', 'signPlace', 'targetCountry'].forEach((k) => { if (hasArabic(v[k])) add(k, u.wArabic(L[k])); });
  add('birthDate', dateIssue(v.birthDate, L.birthDate, u));
  add('childBirth', dateIssue(v.childBirth, L.childBirth, u));
  add('phone', phoneIssue(v.phone, u));
  if (v.phone2) add('phone2', phoneIssue(v.phone2, u));
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) add('email', u.wEmail);
  if (v.year) {
    const y = +latinDigits(String(v.year)); const now = new Date().getFullYear();
    if (!(y >= now - 1 && y <= now + 1)) add('year', u.wYear(L.year));
  }
  return out;
}
function showWarnings(list, goTo, proceed) {
  const u = t();
  count('warnings_shown', { n: list.length, first: list[0].key });
  sheet(h('div', { class: 'msg warnbox' },
    h('h2', { text: u.warnTitle }),
    h('p', { text: u.warnNote }),
    h('ul', { class: 'warnlist' }, list.map((w) => h('li', {},
      h('button', { class: 'warnitem', type: 'button', text: w.msg, onclick: () => { closeSheet(); goTo(w.key); } })))),
    h('button', { class: 'btn primary wide', type: 'button', text: u.warnFix, onclick: () => { closeSheet(); goTo(list[0].key); } }),
    h('button', { class: 'btn ghost wide', type: 'button', text: u.warnGo, onclick: () => { closeSheet(); count('warnings_ignored', { n: list.length }); proceed(); } }),
  ), { tall: list.length > 4 });
}
const flagField = (el) => {
  if (!el) return;
  el.classList.add('warn');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const i = el.querySelector('input.input, textarea.input');
  if (i) setTimeout(() => i.focus({ preventScroll: true }), 350);
};
function goToNidField(key) {
  const sec = SECTIONS.find((s) => s.keys.includes(key));
  if (sec) { app.open = sec.id; persist(); }
  renderForm();
  requestAnimationFrame(() => flagField(document.querySelector(`.field[data-key="${key}"]`)));
}
const goToCField = (key) => flagField(document.querySelector(`[data-c="${key}"]`));

// ---------- yearly reminder for the life certificate ----------
function openReminder() {
  const u = t();
  const when = new Date(); when.setMonth(when.getMonth() + 11);   // about a month before it is due again
  const after = new Date(when); after.setDate(after.getDate() + 1);
  const ymd = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`;
  const shown = `${when.getDate()}/${when.getMonth() + 1}/${when.getFullYear()}`;
  const mission = currentMission();
  const title = u.remindEventTitle + (mission ? ` - ${mission}` : '');
  const phone = `+${OWNER.whatsapp}`;
  const text = `${u.remindEventText(location.origin, phone)}\nhttps://wa.me/${OWNER.whatsapp}`;
  const google = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + `&text=${encodeURIComponent(title)}&dates=${ymd(when)}/${ymd(after)}&details=${encodeURIComponent(text)}`;
  const esc = (x) => x.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const enc = new TextEncoder();
  const fold = (line) => {   // iCalendar lines are at most 75 bytes
    let out = ''; let n = 0;
    for (const ch of line) {
      const b = enc.encode(ch).length;
      if (n + b > 73) { out += '\r\n '; n = 1; }
      out += ch; n += b;
    }
    return out;
  };
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//husham-ahmed//bitaqa//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${newId()}@husham-ahmed.vercel.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(when)}`, `DTEND;VALUE=DATE:${ymd(after)}`,
    `SUMMARY:${esc(title)}`, `DESCRIPTION:${esc(text)}`, `URL:${location.origin}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:PT9H', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].map(fold).join('\r\n');
  const addIcs = () => {
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    if (isIOS()) location.href = url;   // Safari offers "Add to Calendar"
    else { const a = h('a', { href: url, download: 'تذكير-شهادة-الحياة.ics' }); document.body.append(a); a.click(); a.remove(); }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    count('reminder_added', { how: 'ics' }); toast(u.remindDone);
  };
  sheet(h('div', { class: 'msg' },
    h('h2', { text: u.remindTitle }),
    h('p', { text: u.remindText(shown) }),
    h('a', { class: 'btn primary wide', href: google, target: '_blank', rel: 'noopener', onclick: () => { count('reminder_added', { how: 'google' }); closeSheet(); } }, u.remindGoogle),
    h('button', { class: 'btn soft wide', type: 'button', text: u.remindIcs, onclick: () => { addIcs(); closeSheet(); } }),
    h('button', { class: 'btn ghost wide', type: 'button', text: u.close, onclick: closeSheet })));
}

// ---------- print and post it for you ----------
function printMailCard(formLabel) {
  const u = t();
  return h('div', { class: 'printmail' },
    h('p', { class: 'hint', text: u.printMailNote }),
    h('button', { class: 'btn soft wide', type: 'button', text: u.printMail, onclick: () => {
      count('printmail_click', { form: app.view });
      openRequest('printmail', UI.Ara.printMailMsg(formLabel));
    } }));
}

// ---------- sheets (bottom dialogs) ----------
function sheet(content, { tall = false, onClose } = {}) {
  closeSheet();
  const wrap = h('div', { class: 'veil', id: 'veil', onclick: (e) => { if (e.target.id === 'veil') closeSheet(); } },
    h('div', { class: 'sheet' + (tall ? ' tall' : ''), role: 'dialog', 'aria-modal': 'true' }, h('div', { class: 'grip' }), content));
  wrap._onClose = onClose;
  document.body.append(wrap);
  document.body.classList.add('locked');
  requestAnimationFrame(() => wrap.classList.add('in'));
}
function closeSheet() {
  const v = $('#veil');
  if (!v) return;
  v.remove();
  document.body.classList.remove('locked');
  if (v._onClose) v._onClose();
}

let toastTimer;
function toast(msg, ms = 2500) {
  let el = $('#toast');
  if (!el) { el = h('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ---------- picker ----------
function pick(key, done) {
  const rows = listFor(key);
  const input = h('input', { class: 'search', type: 'search', placeholder: t().search, autocomplete: 'off', 'aria-label': t().search });
  const list = h('div', { class: 'options', role: 'listbox' });
  const norm = (s) => (s || '').replace(/[\u0640\u200c]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي').replace(/ک/g, 'ك').trim();
  const draw = () => {
    const q = norm(input.value);
    const hits = q ? rows.filter((r) => norm(r[1]).includes(q)) : rows;
    list.replaceChildren(...hits.slice(0, 150).map(([code, text]) => h('button', {
      class: 'option' + (app.values[key] === code ? ' on' : ''), type: 'button', role: 'option',
      onclick: () => { app.values[key] = code; persist(); closeSheet(); done(); },
    }, text)));
    if (!hits.length) list.append(h('p', { class: 'empty', text: t().noMatch }));
    else if (hits.length > 150) list.append(h('p', { class: 'empty', text: t().typeMore }));
  };
  input.addEventListener('input', draw);
  draw();
  const big = rows.length > 8;
  sheet(h('div', { class: 'picker' },
    h('div', { class: 'picker-top' },
      h('h2', { text: LABELS[app.lang][key] }),
      h('button', { class: 'x', type: 'button', 'aria-label': t().close, onclick: closeSheet, text: '✕' })),
    big ? input : null,
    list,
    app.values[key] && !FIELDS[key].req ? h('button', { class: 'btn ghost wide', type: 'button', text: t().clear,
      onclick: () => { delete app.values[key]; persist(); closeSheet(); done(); } }) : null,
  ), { tall: big });
  if (big && !matchMedia('(pointer: coarse)').matches) input.focus();
}

// ---------- form ----------
function field(key) {
  const f = FIELDS[key];
  const id = 'f_' + key;
  const wrap = h('div', { class: 'field', 'data-key': key });
  const label = h('label', { for: id }, LABELS[app.lang][key], f.req ? h('span', { class: 'req', 'aria-hidden': 'true', text: ' *' }) : null);
  let control;
  if (f.type === 'pick') {
    const txt = app.values[key] ? labelOf(key, app.values[key]) : '';
    control = h('button', { class: 'input pickbtn' + (txt ? '' : ' empty'), id, type: 'button',
      onclick: () => pick(key, () => { wrap.replaceWith(field(key)); refreshStatus(); }) },
      h('span', { text: txt || t().choose }), h('i', { html: ICON.chevron }));
  } else if (f.type === 'date') {
    control = dateSelect(id, app.values[key], (v) => setValue(key, v));
  } else {
    control = h('input', { class: 'input', id, type: f.tel ? 'tel' : 'text', value: app.values[key] || '',
      inputmode: f.type === 'num' ? 'numeric' : 'text', dir: f.type === 'num' ? 'ltr' : null, autocomplete: 'off', enterkeyhint: 'next' });
    control.addEventListener('input', () => {
      const v = clean(control.value);
      if (v !== control.value) control.value = v;
      setValue(key, v);
    });
    control.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const all = [...document.querySelectorAll('.card.open .input')];
      const next = all[all.indexOf(control) + 1];
      if (next) next.focus(); else control.blur();
    });
  }
  wrap.append(label, control);
  const hint = t().hints[key];
  if (hint) wrap.append(h('p', { class: 'hint', text: hint }));
  return wrap;
}

// Day / month / year lists instead of the calendar popup: much quicker for
// birth dates. The value stays YYYY-MM-DD, and is only set once all three are chosen.
function dateSelect(id, value, onChange) {
  const u = t();
  const [y0, m0, d0] = (value || '').split('-').map((n) => +n || 0);
  const now = new Date().getFullYear();
  const pad = (n) => String(n).padStart(2, '0');
  const sel = (label, opts, cur, extra) => {
    const s = h('select', { class: 'input select', 'aria-label': label, ...extra },
      h('option', { value: '', text: label }), opts.map(([v, text]) => h('option', { value: String(v), text })));
    s.value = cur ? String(cur) : '';
    return s;
  };
  const day = sel(u.dDay, Array.from({ length: 31 }, (_, i) => [i + 1, String(i + 1)]), d0, { id });
  const month = sel(u.dMonth, u.cMonths.map((name, i) => [i + 1, `${i + 1} - ${name}`]), m0);
  const year = sel(u.dYear, Array.from({ length: now - 1899 }, (_, i) => [now - i, String(now - i)]), y0);
  const update = () => {
    const d = +day.value; const m = +month.value; const y = +year.value;
    if (d && m && y) {
      const last = new Date(y, m, 0).getDate();   // 31 April -> 30 April
      if (d > last) day.value = String(last);
      onChange(`${y}-${pad(m)}-${pad(+day.value)}`);
    } else onChange('');
  };
  [day, month, year].forEach((s) => s.addEventListener('change', update));
  return h('div', { class: 'dsel' }, day, month, year);
}

function setValue(key, v) {
  if (v) app.values[key] = v; else delete app.values[key];
  const f = document.querySelector(`.field[data-key="${key}"]`);
  if (f && v) f.classList.remove('bad');
  persist();
  refreshStatus();
  if (key === 'a07name1' || key === 'a06name2') { const b = $('.fambar-who b'); if (b) b.textContent = personName(app.values); }
}

function sectionCard(sec, index) {
  const open = app.open === sec.id;
  const miss = missingIn(sec).length;
  const card = h('section', { class: 'card' + (open ? ' open' : ''), id: 'sec_' + sec.id });
  const head = h('button', { class: 'card-head', type: 'button', 'aria-expanded': String(open),
    onclick: () => { app.open = open ? null : sec.id; persist(); renderForm(); if (!open) scrollToCard(sec.id); } },
    h('span', { class: 'num' + (miss === 0 && filledIn(sec) ? ' ok' : ''), html: miss === 0 && filledIn(sec) ? ICON.check : String(index + 1) }),
    h('span', { class: 'card-title' }, h('b', { text: t().sections[sec.id] }), h('small', { class: 'status', 'data-sec': sec.id, text: statusText(sec) })),
    h('i', { class: 'chev', html: ICON.chevron }));
  card.append(head);
  if (open) {
    const body = h('div', { class: 'card-body' }, sec.keys.map(field));
    const nextSec = SECTIONS[index + 1];
    if (nextSec) body.append(h('button', { class: 'btn soft wide', type: 'button', text: t().next,
      onclick: () => { app.open = nextSec.id; persist(); renderForm(); scrollToCard(nextSec.id); } }));
    card.append(body);
  }
  return card;
}
function statusText(sec) {
  const miss = missingIn(sec).length;
  if (miss) return t().missing(miss);
  return filledIn(sec) ? t().done : t().optional;
}
function refreshStatus() {
  SECTIONS.forEach((sec) => {
    const s = document.querySelector(`.status[data-sec="${sec.id}"]`);
    if (s) s.textContent = statusText(sec);
  });
  const done = SECTIONS.filter((s) => !missingIn(s).length && filledIn(s)).length;
  const p = $('#progress-text'); if (p) p.textContent = t().progress(done, SECTIONS.length);
  const bar = $('#progress-bar'); if (bar) bar.style.width = (done / SECTIONS.length * 100) + '%';
}
function scrollToCard(id) {
  requestAnimationFrame(() => { const el = document.getElementById('sec_' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}

// ---------- header, promos ----------
function header() {
  const o = OWNER;
  const head = h('header', { class: 'top' },
    h('div', { class: 'top-row' },
      h('h1', { text: t().appName }),
      installBtn(),
      bigBtn(),
      h('button', { class: 'chip', type: 'button', text: t().otherLang, onclick: () => setLang(app.lang === 'Ara' ? 'Kur' : 'Ara') }),
      h('button', { class: 'chip menu', type: 'button', 'aria-label': t().more, title: t().more, html: ICONS.menu, onclick: openMore })),
    h('div', { class: 'owner' },
      h('a', { class: 'owner-who', href: waLink(t().waHello), target: '_blank', rel: 'noopener', onclick: () => count('whatsapp_click', { place: 'header' }) },
        h('img', { src: o.photo, alt: '', width: 30, height: 30 }),
        h('span', { text: `${t().by} ${o.name[app.lang]}` })),
      social('tt', o.tiktok, 'TikTok', 'tiktok_click'),
      social('fb', o.facebook, 'Facebook', 'facebook_click'),
      social('wa', waLink(t().waHello), 'WhatsApp', 'whatsapp_click')));
  return head;
}
// Turkey e-visa: how to apply yourself on the official site, or ask for help.
const TVISA_URL = 'https://evisa.gov.tr/login';
function openTvisa() {
  const u = t();
  count('tvisa_open');
  sheet(h('div', { class: 'request tvisa' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.tvTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'note', text: u.tvIntro }),
    videoBtn('tvisa'),
    h('p', { class: 'notice', text: u.tvFee }),
    h('p', { class: 'qlabel', text: u.tvNeedTitle }),
    h('ul', { class: 'docs' }, u.tvNeed.map((x) => h('li', { text: x }))),
    h('p', { class: 'qlabel', text: u.tvStepsTitle }),
    h('ol', { class: 'steps' }, u.tvSteps.map((x) => h('li', { text: x }))),
    h('p', { class: 'hint', text: u.tvValid }),
    h('p', { class: 'warnitem static', text: u.tvWarn }),
    h('a', { class: 'btn primary wide', href: TVISA_URL, target: '_blank', rel: 'noopener', onclick: () => count('tvisa_site_open') }, u.tvOpen),
    h('button', { class: 'btn soft wide', type: 'button', text: u.tvHelp, onclick: () => { closeSheet(); openRequest('tvisa'); } }),
    h('p', { class: 'trust small', html: ICON.check }, u.noUpfront),
  ), { tall: true });
}

// Pension data update (National Retirement Authority): do it yourself, or ask for help.
const PENSION_URL = 'https://pension-update.mof.gov.iq';
function openPension() {
  const u = t();
  count('pension_open');
  sheet(h('div', { class: 'request tvisa' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.pnTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'note', text: u.pnIntro }),
    videoBtn('pension'),
    h('p', { class: 'notice', text: u.pnDeadline }),
    h('div', { class: 'abroadbox' }, h('b', { text: u.pnAbroadTitle }), h('ul', { class: 'docs' }, u.pnAbroad.map((x) => h('li', { text: x })))),
    h('p', { class: 'qlabel', text: u.pnNeedTitle }),
    h('ul', { class: 'docs' }, u.pnNeed.map((x) => h('li', { text: x }))),
    h('p', { class: 'qlabel', text: u.pnStepsTitle }),
    h('ol', { class: 'steps' }, u.pnSteps.map((x) => h('li', { text: x }))),
    h('p', { class: 'hint', text: u.pnMismatch }),
    h('p', { class: 'warnitem static', text: u.pnWarn }),
    h('a', { class: 'btn primary wide', href: PENSION_URL, target: '_blank', rel: 'noopener', onclick: () => count('pension_site_open') }, u.pnOpen),
    h('button', { class: 'btn soft wide', type: 'button', text: u.pnHelp, onclick: () => { closeSheet(); openRequest('pension'); } }),
    shareBtn(u.pnTitle, `/g/pension${app.lang === 'Kur' ? '-ku' : ''}.html`, 'pension'),
    h('p', { class: 'trust small', html: ICON.check }, u.noUpfront),
  ), { tall: true });
}

// ---------- share a guide or an answer (link with a preview picture) ----------
async function shareLink(title, path, place) {
  const url = location.origin + path;
  const text = `${title}\n${t().shareVia}`;
  count('link_shared', { place });
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
}
const shareBtn = (title, path, place) => h('button', { class: 'btn soft wide sharebtn', type: 'button', text: t().shareGuide, onclick: () => shareLink(title, path, place) });

// ---------- سؤال وجواب (questions people send, answered by the admin; see api/qa.js) ----------
const QA_KEY = 'bitaqa.qa.v1';
const QA_CATS = ['all', 'nid', 'passport', 'poa', 'pension', 'germany', 'travel', 'other'];
let qaItems = null;
try { qaItems = JSON.parse(localStorage.getItem(QA_KEY) || 'null'); } catch (e) { /* ignore */ }
async function loadQA() {
  try {
    const res = await fetch('/api/qa?a=list');
    if (!res.ok) return qaItems;
    const d = await res.json();
    if (Array.isArray(d.items)) {
      qaItems = d.items;
      try { localStorage.setItem(QA_KEY, JSON.stringify(qaItems)); } catch (e) { /* ignore */ }
    }
  } catch (e) { /* offline: keep the saved copy */ }
  return qaItems;
}
const qaNorm = (s) => String(s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ً-ْـ]/g, '');
function openQA(focusAsk, openId = null) {
  const u = t();
  count('qa_open');
  let cat = 'all';
  const search = h('input', { class: 'input', type: 'search', id: 'qa_search', placeholder: u.qaSearch, autocomplete: 'off' });
  const list = h('div', { class: 'qa-list' });
  const chips = h('div', { class: 'chips qa-chips' });
  const draw = () => {
    chips.replaceChildren(...QA_CATS.map((c) => h('button', { class: 'chipbtn' + (cat === c ? ' on' : ''), type: 'button', text: u.qaCats[c], onclick: () => { cat = c; draw(); } })));
    if (!qaItems) { list.replaceChildren(h('p', { class: 'note', text: u.qaLoading })); return; }
    const words = qaNorm(search.value).split(/\s+/).filter(Boolean);
    const shown = qaItems.filter((x) => (cat === 'all' || x.cat === cat) && words.every((w) => qaNorm(x.q + ' ' + x.a).includes(w)));
    list.replaceChildren(...(shown.length ? shown.map((x) => h('details', { class: 'qa-item', 'data-id': x.id, ontoggle: (e) => { if (e.target.open) count('qa_read', { id: x.id }); } },
      h('summary', { text: x.q }),
      h('p', { text: x.a }),
      h('button', { class: 'linkbtn qa-sharebtn', type: 'button', text: u.shareAnswer, onclick: () => shareLink(x.q, `/qa#q-${x.id}`, 'qa') }))) : [h('p', { class: 'note', text: u.qaNone })]));
    if (openId) { const el = list.querySelector(`[data-id="${openId}"]`); if (el) { el.open = true; setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250); openId = null; } }
  };
  search.addEventListener('input', draw);
  const ask = h('textarea', { class: 'input area', id: 'qa_ask', rows: 3, maxlength: 400, placeholder: u.qaAskPh });
  const askMsg = h('p', { class: 'hint' });
  const askBtn = h('button', { class: 'btn primary wide', type: 'button', text: u.qaSend, onclick: async () => {
    const q = ask.value.trim();
    if (q.length < 8) { askMsg.className = 'err'; askMsg.textContent = u.qaShortQ; return; }
    askBtn.disabled = true;
    try {
      const res = await fetch('/api/qa?a=ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, lang: app.lang }) });
      if (res.status === 429) throw new Error('slow');
      if (!res.ok) throw new Error('fail');
      ask.value = ''; askMsg.className = 'trust'; askMsg.textContent = u.qaThanks;
      count('qa_asked');
    } catch (e) { askMsg.className = 'err'; askMsg.textContent = e.message === 'slow' ? u.qaSlow : u.qaFail; }
    finally { askBtn.disabled = false; }
  } });
  sheet(h('div', { class: 'request tvisa qa' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.qaTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'note', text: u.qaIntro }),
    search, chips, list,
    h('div', { class: 'qa-askbox', id: 'qa_askbox' },
      h('b', { text: u.qaAskTitle }),
      h('p', { class: 'hint', text: u.qaAskNote }),
      ask, askMsg, askBtn),
  ), { tall: true });
  draw();
  loadQA().then(() => { if ($('#qa_search')) draw(); });
  if (focusAsk) setTimeout(() => { const b = $('#qa_askbox'); if (b) b.scrollIntoView({ behavior: 'smooth' }); }, 300);
}

// ---------- German citizenship preparation ----------
function openNatur() {
  const u = t();
  const n = NATUR[app.lang] || NATUR.Ara;
  count('natur_open');
  sheet(h('div', { class: 'request tvisa natur' },
    h('div', { class: 'picker-top' }, h('h2', { text: n.title }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'note', text: n.intro }),
    h('button', { class: 'btn primary wide big', type: 'button', text: n.quizBtn, onclick: () => startQuiz() }),
    h('button', { class: 'btn soft wide', type: 'button', text: n.interviewBtn, onclick: openInterview }),
    h('p', { class: 'qlabel', text: n.needTitle }),
    h('ul', { class: 'docs' }, n.need.map((x) => h('li', { text: x }))),
    h('p', { class: 'qlabel', text: n.factsTitle }),
    h('ul', { class: 'docs' }, n.facts.map((x) => h('li', { text: x }))),
    h('p', { class: 'notice', text: n.interviewNote }),
    h('p', { class: 'hint', text: n.help }),
    h('button', { class: 'btn soft wide', type: 'button', text: u.gHelp, onclick: () => { closeSheet(); openRequest(null, 'مساعدة بالأوراق العراقية المطلوبة للتجنيس (الجنسية الألمانية)'); } }),
    shareBtn(n.title, `/g/natur${app.lang === 'Kur' ? '-ku' : ''}.html`, 'natur'),
    h('p', { class: 'hint' }, n.source, ...NATUR_SOURCES.map(([name, url]) => h('a', { class: 'srclink', href: url, target: '_blank', rel: 'noopener', text: name }))),
  ), { tall: true });
}
function startQuiz() {
  const pool = QUIZ.map((q, i) => i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const picked = pool.slice(0, 10);
  let at = 0; let score = 0;
  count('quiz_start');
  const show = () => {
    const u = t();
    const n = NATUR[app.lang] || NATUR.Ara;
    const [q, opts, right, why] = QUIZ[picked[at]];
    let answered = false;
    const expl = h('div', { class: 'quiz-expl' });
    const nextBtn = h('button', { class: 'btn primary wide', type: 'button', hidden: true,
      text: at + 1 < picked.length ? n.next : n.finish, onclick: () => { at += 1; if (at < picked.length) show(); else done(); } });
    const buttons = opts.map((o, i) => h('button', { class: 'quiz-opt', type: 'button', text: o, onclick: () => {
      if (answered) return;
      answered = true;
      if (i === right) score += 1;
      buttons.forEach((b, k) => { b.classList.toggle('ok', k === right); b.classList.toggle('bad', k === i && i !== right); b.disabled = true; });
      expl.replaceChildren(h('b', { class: i === right ? 'good' : 'badtxt', text: i === right ? n.right : n.wrong }), ' ', why);
      nextBtn.hidden = false;
    } }));
    sheet(h('div', { class: 'quiz' },
      h('div', { class: 'picker-top' }, h('small', { class: 'quiz-count', text: n.qOf(at + 1, picked.length) }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: openNatur, text: '✕' })),
      h('div', { class: 'quiz-bar' }, h('i', { style: null })),
      h('h2', { class: 'quiz-q', text: q }),
      h('div', { class: 'quiz-opts' }, buttons),
      expl, nextBtn,
      h('p', { class: 'hint', text: n.quizNote })), { tall: true });
    const bar = $('.quiz-bar i'); if (bar) bar.style.width = `${((at) / picked.length) * 100}%`;
  };
  const done = () => {
    const u = t();
    const n = NATUR[app.lang] || NATUR.Ara;
    count('quiz_done', { score });
    sheet(h('div', { class: 'quiz msg' },
      h('div', { class: 'picker-top' }, h('h2', { text: n.result(score, picked.length) }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: openNatur, text: '✕' })),
      h('div', { class: 'quiz-score' + (score >= 5 ? ' pass' : '') }, h('b', { text: `${score}/${picked.length}` })),
      h('p', { text: score >= 5 ? n.pass : n.fail }),
      h('button', { class: 'btn primary wide', type: 'button', text: n.again, onclick: () => startQuiz() }),
      h('button', { class: 'btn soft wide', type: 'button', text: n.interviewBtn, onclick: openInterview }),
      h('button', { class: 'btn ghost wide', type: 'button', text: shareLabel(), onclick: shareApp })));
  };
  show();
}
const shareLabel = () => t().shareApp;
function openInterview() {
  const u = t();
  const n = NATUR[app.lang] || NATUR.Ara;
  count('interview_open');
  sheet(h('div', { class: 'request interview' },
    h('div', { class: 'picker-top' }, h('h2', { text: n.ivTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: openNatur, text: '✕' })),
    h('p', { class: 'note', text: n.ivIntro }),
    INTERVIEW.map(([de, ar, tip, sample]) => h('div', { class: 'ivcard' },
      h('b', { class: 'ivq', dir: 'ltr', text: de }),
      h('p', { class: 'iva', text: ar }),
      h('p', { class: 'ivtip' }, h('small', { text: `${n.ivTip}: ` }), tip),
      h('details', {}, h('summary', { text: n.ivSample }), h('p', { class: 'ivs', dir: 'ltr', text: sample })))),
  ), { tall: true });
}

// ---------- scrolling news bar ----------
function newsTicker() {
  const u = t();
  const L = app.lang === 'Kur' ? 'Kur' : 'Ara';
  const now = new Date();
  const pad = (x) => String(x).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const items = NEWS.filter((n) => (!n.from || today >= n.from) && (!n.to || today <= n.to) && (!n.until || Date.now() < Date.parse(n.until)));
  if (!items.length) return null;
  const go = { natur: openNatur, tvisa: openTvisa, pension: openPension, guide: () => goSection('guide'), services: () => goSection('services'),
    consular: () => openForms('consular'), nid: () => openForms('nid') };
  const run = () => items.map((n) => h('button', { class: 'news-item', type: 'button', text: n[L] || n.Ara,
    onclick: () => { count('news_click', { go: n.go }); (go[n.go] || (() => {}))(); } }));
  const track = h('div', { class: 'news-track' }, h('div', { class: 'news-run' }, run()), h('div', { class: 'news-run', 'aria-hidden': 'true' }, run()));
  const chars = items.reduce((a, n) => a + (n[L] || n.Ara).length, 0);
  track.style.animationDuration = `${Math.max(25, Math.round(chars * 0.22))}s`;
  return h('div', { class: 'news', role: 'region', 'aria-label': u.newsLabel },
    h('span', { class: 'news-label', text: u.newsLabel }),
    h('div', { class: 'news-view' }, track));
}

// ---------- video explanations (open on TikTok; hidden until a link is set) ----------
function videoBtn(key) {
  const url = VIDEOS[key];
  if (!url || !/^https:\/\/([a-z]+\.)?tiktok\.com\//.test(url)) return null;
  return h('a', { class: 'btn video wide', href: url, target: '_blank', rel: 'noopener', html: ICON.tt,
    onclick: () => count('video_click', { key }) }, t().videoBtn);
}

// ---------- official announcements (hide themselves after their end date) ----------
const NOTICE_KEY = 'bitaqa.noticesHidden';
function noticeCards() {
  const u = t();
  const L = app.lang === 'Kur' ? 'Kur' : 'Ara';
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  let hidden = [];
  try { hidden = JSON.parse(localStorage.getItem(NOTICE_KEY) || '[]'); } catch (e) { /* ignore */ }
  // `until` (optional ISO time) ends a notice at an exact moment, e.g. 12 hours after posting.
  const current = NOTICES.filter((n) => today >= n.from && today <= n.to && (!n.until || Date.now() < Date.parse(n.until)));
  const live = current.filter((n) => !hidden.includes(n.id));
  if (!current.length) return null;
  const wrap = h('div', { class: 'notices' });
  const showAgain = () => h('button', { class: 'notice-show', type: 'button', text: u.noticeShow(current.length), onclick: () => {
    try { localStorage.setItem(NOTICE_KEY, JSON.stringify(hidden.filter((id) => !current.some((n) => n.id === id)))); } catch (e) { /* ignore */ }
    wrap.replaceWith(noticeCards() || '');
    count('notice_show');
  } });
  if (!live.length) { wrap.append(showAgain()); return wrap; }
  wrap.append(...live.map((n) => {
    const card = h('div', { class: 'offnotice', role: 'note' },
      h('div', { class: 'offnotice-top' },
        h('small', { text: n.who[L] }),
        h('button', { class: 'offnotice-x', type: 'button', 'aria-label': u.noticeHide, text: '✕', onclick: () => {
          try { localStorage.setItem(NOTICE_KEY, JSON.stringify([...hidden, n.id])); } catch (e) { /* ignore */ }
          hidden = [...hidden, n.id];
          card.remove(); count('notice_hide', { id: n.id });
          if (!wrap.querySelector('.offnotice')) wrap.append(showAgain());
        } })),
      h('b', { text: n.title[L] }),
      h('p', { text: n.text[L] }),
      // Optional official link: only https addresses on Iraqi government domains open.
      n.link && /^https:\/\/([a-z0-9-]+\.)*gov\.iq(\/|$)/i.test(n.link.url || '')
        ? h('a', { class: 'btn primary wide offnotice-link', href: n.link.url, target: '_blank', rel: 'noopener',
          onclick: () => count('notice_link', { id: n.id }) }, (n.link[L] || n.link.Ara || n.link.url))
        : null);
    return card;
  }));
  return wrap;
}

// ---------- a personal note from Husham ----------
// Today's occasion, if any (yearly MM-DD ranges may wrap past New Year).
function occasionToday(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const md = `${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const ymd = `${now.getFullYear()}-${md}`;
  return OCCASIONS.find((o) => {
    if (o.from.length === 10) return ymd >= o.from && ymd <= o.to;
    return o.from <= o.to ? md >= o.from && md <= o.to : md >= o.from || md <= o.to;
  });
}
function meRibbon() {
  const u = t();
  const occ = occasionToday();
  const L = app.lang === 'Kur' ? 'Kur' : 'Ara';
  const ribbon = h('button', { class: 'me-ribbon' + (occ ? ' festive' : ''), type: 'button', onclick: openAboutMe },
    h('img', { src: OWNER.photo, alt: '', width: 52, height: 52 }),
    h('span', { class: 'me-body' },
      h('small', { class: 'me-tag', text: occ ? occ.tag[L] : u.meTag }),
      h('span', { text: occ ? `${occ.text[L]} — ${OWNER.name[app.lang]}` : u.meRibbon })),
    h('span', { class: 'me-more', text: u.meMore }));
  const stat = (num, label) => h('div', { class: 'imp' }, h('b', { text: num }), h('small', { text: label }));
  const impact = h('div', { class: 'impact', role: 'group', 'aria-label': u.impAsOf(IMPACT.asOf[L]) },
    stat(`+${IMPACT.people}`, u.impPeople),
    stat(`+${IMPACT.forms}`, u.impForms),
    stat(u.impFree, u.impFreeSub),
    h('small', { class: 'imp-date', text: u.impAsOf(IMPACT.asOf[L]) }));
  // Real number from the last 7 days; hidden while it is still small.
  const week = IMPACT.week >= 5 ? h('p', { class: 'week-done', text: u.weekDone(IMPACT.week) }) : null;
  return h('div', { class: 'me-wrap' }, ribbon, week, impact);
}
// Independent-app notice (required by Google Play for apps with government information).
const disclaimerNote = () => h('p', { class: 'disclaimer' }, t().disclaimer, h('br'),
  h('a', { href: '/privacy.html', target: '_blank', rel: 'noopener', text: t().privacy }));

function openAboutMe() {
  const u = t();
  count('about_open');
  sheet(h('div', { class: 'about' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.meTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('div', { class: 'about-head' }, h('img', { src: OWNER.photo, alt: '', width: 96, height: 96 }),
      h('div', {}, h('b', { text: OWNER.name[app.lang] }), h('small', { text: u.contactNote }))),
    u.meText.map((x) => h('p', { text: x })),
    h('p', { class: 'trust', html: ICON.check }, u.noUpfront),
    h('p', { class: 'about-sign', text: u.meSign }),
    h('a', { class: 'btn wa wide', href: waLink(u.waHello), target: '_blank', rel: 'noopener', html: ICON.wa, onclick: () => count('whatsapp_click', { place: 'about' }) }, u.whatsapp),
    h('div', { class: 'two' },
      h('a', { class: 'btn tt', href: OWNER.tiktok, target: '_blank', rel: 'noopener', html: ICON.tt, onclick: () => count('tiktok_click', { place: 'about' }) }, u.tiktok),
      h('a', { class: 'btn fb', href: OWNER.facebook, target: '_blank', rel: 'noopener', html: ICON.fb, onclick: () => count('facebook_click', { place: 'about' }) }, u.facebook)),
    h('div', { class: 'two' },
      h('button', { class: 'btn soft', type: 'button', text: u.saveContact, onclick: saveContact }),
      h('button', { class: 'btn soft', type: 'button', text: u.shareApp, onclick: shareApp })),
    disclaimerNote(),
  ), { tall: true });
}

// ---------- دليل المعاملات ----------
function openGuides() {
  const u = t();
  count('guides_open');
  const row = (title, short, onclick) => h('button', { class: 'option country', type: 'button', onclick }, h('b', { text: title }), h('small', { text: short }));
  sheet(h('div', { class: 'picker guides' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.gTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'note', text: u.gIntro }),
    h('div', { class: 'options' },
      GUIDES.map((g) => row(g[app.lang].title, g[app.lang].short, () => openGuide(g.id, true))),
      row(u.pnTitle, u.pnShort, openPension),
      row(u.tvTitle, u.tvShort, openTvisa)),
  ), { tall: true });
}
function guideAction(kind) {
  closeSheet();
  app.view = 'consular'; persistView();
  app.cReview = false;
  if (kind === 'apostille') {
    cState.country = 'ألمانيا';
    if (!findMission(cState.country, cState.city)) cState.city = 'فرانكفورت';
    cState.consulate = templateOf();
    cState.form = 'apostille';
  } else {
    cState.form = 'poa';
    delete cState.values.__fresh;
    cState.values.purposeType = kind === 'poaBirth' ? 'birth' : 'marriage';
    cState.values.purpose = purposeText();
  }
  cSave();
  count('guide_action', { kind });
  renderConsular(); scrollTo(0, 0);
}
function openGuide(id, fromList) {
  const g = findGuide(id);
  if (!g) return;
  const u = t();
  const x = g[app.lang] || g.Ara;
  count('guide_view', { id });
  sheet(h('div', { class: 'request tvisa' },
    h('div', { class: 'picker-top' }, h('h2', { text: x.title }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    fromList ? h('button', { class: 'linkbtn', type: 'button', text: u.gBack, onclick: openGuides }) : null,
    h('p', { class: 'note', text: x.intro }),
    videoBtn('guide_' + g.id),
    checklist('g:' + g.id, x.need),
    apptButton('g:' + g.id),
    h('p', { class: 'qlabel', text: u.gSteps }),
    h('ol', { class: 'steps' }, x.steps.map((n) => h('li', { text: n }))),
    h('p', { class: 'notice', text: x.note }),
    (g.actions || []).map((a) => h('button', { class: 'btn soft wide', type: 'button', text: u.gActions[a], onclick: () => guideAction(a) })),
    shareBtn(x.title, `/g/${g.id}${app.lang === 'Kur' ? '-ku' : ''}.html`, 'guide_' + g.id),
    g.noBook ? null : h('a', { class: 'btn primary wide', href: ICASS_URL, target: '_blank', rel: 'noopener', onclick: () => count('guide_book', { id }) }, u.gBook),
    h('button', { class: 'btn soft wide', type: 'button', text: u.gHelp, onclick: () => { closeSheet(); openRequest(g.service, `${UI.Ara.gTitle}: ${g.Ara.title}`); } }),
    h('p', { class: 'trust small', html: ICON.check }, u.noUpfront),
    h('p', { class: 'hint' }, u.gSource, ' ', ...g.source.map((url, i) => h('a', { href: url, target: '_blank', rel: 'noopener', text: `(${i + 1})` }))),
  ), { tall: true });
}

// Shortcuts to the services, in the header's free space (a scrolling row on phones).
function quickNav() {
  const u = t();
  const item = (id, onclick, hot) => h('button', { class: 'qbtn' + (hot ? ' hot' : ''), type: 'button', onclick: () => { count('quick_click', { item: id }); onclick(); } },
    u.quick[id], hot ? h('small', { text: u.quickNew }) : null);
  const design = UI.Ara.promos.find((p) => p.key === 'design');
  return h('nav', { class: 'quick', 'aria-label': u.quickTitle },
    item('qa', () => openQA(), true),
    item('pension', openPension, true),
    item('tvisa', openTvisa, true),
    item('guides', openGuides),
    item('booking', () => openRequest(null)),
    item('passport', () => openGuide('passport')),
    item('lawyer', () => openRequest('lawyer')),
    item('printmail', () => openRequest('printmail')),
    item('design', () => window.open(waLink(design ? design.msg : t().waHello), '_blank', 'noopener')));
}
function social(icon, href, label, ev) {
  return h('a', { class: 'soc', href, target: '_blank', rel: 'noopener', 'aria-label': label, html: ICON[icon], onclick: () => count(ev, { place: 'header' }) });
}

let promoTimer;
function promoBanner() {
  const items = t().promos;
  let i = 0;
  const title = h('b'); const text = h('span');
  const box = h('a', { class: 'promo', target: '_blank', rel: 'noopener', onclick: (e) => {
    const key = items[i].key;
    count(key + '_click', { place: 'banner' });
    if (key === 'tvisa') { e.preventDefault(); openTvisa(); }
    else if (key === 'booking' || key === 'lawyer') { e.preventDefault(); openRequest(key === 'lawyer' ? 'lawyer' : null); }
  } },
    h('span', { class: 'promo-tag', text: '★' }), h('span', { class: 'promo-body' }, title, text));
  const show = () => {
    const p = items[i];
    title.textContent = p.title; text.textContent = p.text; box.href = waLink(p.msg);
    box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
  };
  show();
  clearInterval(promoTimer);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) promoTimer = setInterval(() => { i = (i + 1) % items.length; show(); }, 5000);
  return box;
}

// ---------- bigger text (for everyone) ----------
const BIG_KEY = 'bitaqa.bigText';
function applyBig(on) {
  document.documentElement.classList.toggle('big', on);
  try { localStorage.setItem(BIG_KEY, on ? '1' : ''); } catch (e) { /* ignore */ }
}
try { applyBig(localStorage.getItem(BIG_KEY) === '1'); } catch (e) { /* ignore */ }
function bigBtn() {
  const on = document.documentElement.classList.contains('big');
  return h('button', { class: 'chip', type: 'button', 'aria-pressed': String(on), 'aria-label': on ? t().normalText : t().bigText,
    onclick: () => { applyBig(!on); if (!on) count('big_text_on'); renderCurrent(); } }, on ? 'A−' : 'A+');
}

// ---------- tabs ----------
function tabs() {
  const u = t();
  const tab = (id, label) => h('button', { class: 'tab' + (app.view === id ? ' on' : ''), type: 'button', 'aria-pressed': String(app.view === id),
    onclick: () => { if (app.view === id) return; app.view = id; persistView(); app.review = false; app.cReview = false; renderCurrent(); scrollTo(0, 0); navPush(); } }, label);
  return h('nav', { class: 'tabs', 'aria-label': u.appName }, tab('nid', u.tabNid), tab('consular', u.tabConsular));
}
function persistView() { try { localStorage.setItem('bitaqa.view', app.view); } catch (e) { /* ignore */ } }

// ---------- consular forms ----------
const C_KEY = 'bitaqa.consular.v1';
const cState = (() => {
  try { return JSON.parse(localStorage.getItem(C_KEY) || 'null') || {}; } catch (e) { return {}; }
})();
if (!cState.country) {  // earlier versions only knew Frankfurt/Berlin
  cState.country = 'ألمانيا';
  cState.city = cState.consulate === 'berlin' ? 'برلين' : 'فرانكفورت';
}
const templateOf = () => OWN_FORMS[`${cState.country}|${cState.city}`] || 'generic';
cState.consulate = templateOf();
cState.form = cState.form || 'poa';
cState.values = cState.values || {};
const cSave = () => { try { localStorage.setItem(C_KEY, JSON.stringify(cState)); } catch (e) { /* ignore */ } };

function cClear() {
  // Start a fresh form: keep nothing personal, and don't copy the ID form in again.
  cState.values = { __fresh: true };
  cSave();
}
function cPrefill() {
  const v = cState.values;
  const f = v.__fresh ? {} : (app.values || {});
  if (!v.principal) {
    const full = [f.a07name1, f.a06name2, f.a09name3, f.a08name4].filter(Boolean).join(' ');
    if (full) v.principal = full;
  }
  if (!v.mother && f.a11motherName) v.mother = [f.a11motherName, f.a10motherFatherName].filter(Boolean).join(' ');
  if (!v.phone && f.a40phone) v.phone = f.a40phone;
  if (!v.birthDate && f.a05birthDate) v.birthDate = f.a05birthDate;
  if (!v.month) { v.month = UI.Ara.cMonths[new Date().getMonth()]; v.year = String(new Date().getFullYear()); }
  if (!v.purposeType) v.purposeType = 'records';
  if (!v.docCount) v.docCount = '1';
  if (!v.targetCountry) v.targetCountry = 'Irak';
  if (!v.firstName && !v.lastName && v.latinName) {
    const parts = v.latinName.trim().split(/\s+/);
    v.lastName = parts.length > 1 ? parts.pop() : '';
    v.firstName = parts.join(' ');
  }
  if (v.purpose === undefined) v.purpose = purposeText();
}
function purposeText() {
  const v = cState.values;
  const tpl = POA_PURPOSES[v.purposeType || 'records'] || '';
  return tpl.replace('{place}', v.place || '..........').replace('{passport}', v.passportNo || '..........')
    .replace('{school}', v.school ? `كافة منها ${v.school}` : 'كافة')
    .replaceAll('{childRel}', v.childRel || 'ابنتي')
    .replaceAll('{child}', v.child || '..........')
    .replaceAll('{childBirth}', v.childBirth ? v.childBirth.split('-').reverse().map((n) => String(+n)).join('-') : '')
    .replace('{spouse}', v.spouse || '..........')
    .replace('{spouseNat}', v.spouseNat ? `${v.spouseNat} الجنسية` : '')
    .replace(/\s+([،,])/g, '$1').replace(/ {2,}/g, ' ');
}
const noForm = () => NO_FORM.has(`${cState.country}|${cState.city}`);
const currentMission = () => {
  const m = findMission(cState.country, cState.city);
  return m ? missionTitle(m.country, m.city, m.type) : '';
};
function cValues() {
  const v = { ...cState.values, __mission: currentMission() };
  if (cState.consulate === 'berlin' && cState.form === 'poa') {
    if (!v.principalAddress) v.principalAddress = ['ألمانيا', v.street, v.plzCity].filter(Boolean).join('، ');
  }
  return v;
}

function cField(key) {
  const u = t();
  const v = cState.values;
  const label = u.cLabels[key];
  const required = cState.form === 'apostille' ? ['firstName', 'lastName', 'street', 'plzCity'].includes(key) : (key === 'principal' || key === 'agent');
  const wrap = h('div', { class: 'field', 'data-c': key });
  wrap.append(h('label', { for: 'c_' + key }, label, required ? h('span', { class: 'req', text: ' *' }) : null));
  const bind = (el, after) => el.addEventListener('input', () => {
    v[key] = el.value; cSave(); wrap.classList.remove('bad', 'warn'); if (after) after();
    if (key === 'principal') suggesters.forEach((f) => f());
  });

  if (key === 'purposeType') {
    // Frankfurt has its own general power-of-attorney form, so the general wording is offered there.
    const types = Object.entries(u.cPurposeTypes).filter(([id]) => !(id === 'generalCustom' && cState.consulate === 'frankfurt'));
    const chips = h('div', { class: 'chips' }, types.map(([id, name]) =>
      h('button', { class: 'chipbtn' + (v.purposeType === id ? ' on' : ''), type: 'button', text: name, onclick: () => {
        v.purposeType = id; v.purpose = id === 'custom' ? '' : purposeText(); cSave(); renderConsular(true);
      } })));
    wrap.append(chips);
    return wrap;
  }
  if (key === 'gpoaType') {
    const cur = v.gpoaType === 'custom' ? 'custom' : 'full';
    const chips = Object.entries(u.cGpoaTypes).map(([id, name]) => h('button', {
      class: 'chipbtn' + (cur === id ? ' on' : ''), type: 'button', text: name,
      onclick: () => { v.gpoaType = id; cSave(); renderConsular(true); } }));
    wrap.append(h('div', { class: 'chips' }, chips));
    if (cur === 'custom') wrap.append(h('p', { class: 'hint', text: u.cGpoaCustomNote }));
    return wrap;
  }
  if (key === 'anrede') {
    wrap.append(h('div', { class: 'chips' }, Object.entries(u.cAnrede).map(([id, name]) => h('button', {
      class: 'chipbtn' + (v.anrede === id ? ' on' : ''), type: 'button', text: name,
      onclick: () => { v.anrede = id; cSave(); renderConsular(true); } }))));
    return wrap;
  }
  if (key === 'marital') {
    wrap.append(h('div', { class: 'chips' }, MARITAL.map((m) => h('button', { class: 'chipbtn' + (v.marital === m ? ' on' : ''), type: 'button', text: m,
      onclick: () => { v.marital = m; cSave(); renderConsular(true); } }))));
    return wrap;
  }
  if (key === 'month') {
    const sel = h('select', { class: 'input select', id: 'c_month' }, UI.Ara.cMonths.map((m, i) => h('option', { value: m, text: u.cMonths[i] })));
    sel.value = v.month || '';
    sel.addEventListener('change', () => { v.month = sel.value; cSave(); });
    wrap.append(sel);
    return wrap;
  }
  if (key === 'purpose') {
    if (v.purposeType === 'custom' || true) {
      const ta = h('textarea', { class: 'input area tall', id: 'c_purpose', rows: 7 });
      ta.value = v.purpose || '';
      bind(ta);
      wrap.append(ta, h('p', { class: 'hint', text: u.cPurposeNote }));
    }
    return wrap;
  }
  // Only ask for what the chosen power-of-attorney text needs.
  if (key === 'place' && !['records', 'birthRecord'].includes(v.purposeType)) return null;
  if (key === 'passportNo' && !['lostTwice', 'damaged'].includes(v.purposeType)) return null;
  if (key === 'school' && v.purposeType !== 'education') return null;
  if (['childRel', 'child', 'childBirth'].includes(key) && !['birth', 'birthMarriage'].includes(v.purposeType)) return null;
  if (['spouse', 'spouseNat'].includes(key) && !['marriage', 'birthMarriage'].includes(v.purposeType)) return null;
  if (key === 'childRel') {
    wrap.append(h('div', { class: 'chips' }, ['ابنتي', 'ابني'].map((rel) => h('button', {
      class: 'chipbtn' + ((v.childRel || 'ابنتي') === rel ? ' on' : ''), type: 'button', text: rel,
      onclick: () => { v.childRel = rel; v.purpose = purposeText(); cSave(); renderConsular(true); } }))));
    return wrap;
  }
  if (key === 'birthDate' || key === 'childBirth') {
    wrap.append(dateSelect('c_' + key, v[key], (val) => {
      if (val) v[key] = val; else delete v[key];
      cSave(); wrap.classList.remove('bad', 'warn');
      if (key === 'childBirth' && v.purposeType !== 'custom') {
        v.purpose = purposeText(); cSave();
        const ta = document.getElementById('c_purpose'); if (ta) ta.value = v.purpose;
      }
    }));
    return wrap;
  }
  const latin = ['latinName', 'street', 'plzCity', 'firstName', 'lastName', 'email', 'targetCountry', 'signPlace', 'docCount'].includes(key);
  const type = key === 'birthDate' || key === 'childBirth' ? 'date' : key === 'phone' || key === 'phone2' ? 'tel' : 'text';
  const inp = h('input', { class: 'input', id: 'c_' + key, type, dir: latin || key === 'phone' || key === 'phone2' ? 'ltr' : null, autocomplete: 'off',
    inputmode: key === 'year' || key === 'docCount' ? 'numeric' : key === 'email' ? 'email' : null });
  inp.value = v[key] || '';
  if (key === 'passportNo') inp.setAttribute('dir', 'ltr');
  if (key === 'school') inp.setAttribute('placeholder', 'مثلاً: إعدادية الميثاق المسائية / نينوى');
  if (key === 'spouseNat') inp.setAttribute('placeholder', 'مثلاً: بريطانية');
  bind(inp, ['place', 'passportNo', 'school', 'child', 'childBirth', 'spouse', 'spouseNat'].includes(key) && v.purposeType !== 'custom' ? () => {
    v.purpose = purposeText(); cSave();
    const ta = document.getElementById('c_purpose'); if (ta) ta.value = v.purpose;
  } : null);
  wrap.append(inp);
  if (SUGGEST[key]) wrap.append(suggestButton(key, inp));
  return wrap;
}

// Latin spelling suggested from the Arabic name, one tap to use it.
const SUGGEST = {
  latinName: (n) => toLatin(n),
  firstName: (n) => toLatin(n.split(/\s+/)[0]),
  lastName: (n) => { const p = n.split(/\s+/); return p.length > 1 ? toLatin(p[p.length - 1]) : ''; },
};
const suggesters = new Set();
const arabicName = () => (cState.values.principal
  || (cState.values.__fresh ? '' : [app.values.a07name1, app.values.a06name2, app.values.a09name3, app.values.a08name4].filter(Boolean).join(' '))
  || '').trim();
function suggestButton(key, inp) {
  const u = t();
  const v = cState.values;
  const value = h('b', { dir: 'ltr' });
  const btn = h('button', { class: 'sugg', type: 'button' }, h('span', { text: `${u.suggest}: ` }), value, h('small', { text: u.suggestNote }));
  const update = () => {
    const name = arabicName();
    const s = name && hasArabic(name) ? SUGGEST[key](name) : '';
    value.textContent = s;
    btn.hidden = !s || s.toLowerCase() === (inp.value || '').trim().toLowerCase();
  };
  btn.addEventListener('click', () => {
    inp.value = value.textContent; v[key] = inp.value; cSave(); update();
    inp.closest('.field').classList.remove('bad', 'warn');
    count('latin_suggest', { field: key });
  });
  inp.addEventListener('input', update);
  suggesters.add(update);
  update();
  return btn;
}

// Searchable country picker (matches country or mission city names).
function countrySelect() {
  const u = t();
  return h('button', { class: 'input pickbtn', id: 'c_country', type: 'button', 'aria-haspopup': 'listbox', onclick: openCountryPicker },
    h('span', { text: cState.country }), h('i', { html: ICON.chevron }));
}
function openCountryPicker() {
  const u = t();
  const norm = (x) => (x || '').replace(/[\u0640\u200c]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[ىی]/g, 'ي').trim();
  const input = h('input', { class: 'search', type: 'search', placeholder: u.cCountrySearch, autocomplete: 'off', 'aria-label': u.cCountrySearch });
  const list = h('div', { class: 'options', role: 'listbox' });
  const choose = (country, city) => {
    cState.country = country;
    const c = MISSIONS.find(([n]) => n === country);
    cState.city = city || (c ? c[1][0][0] : '');
    cState.consulate = templateOf(); cSave(); closeSheet(); renderConsular(true);
  };
  const draw = () => {
    const q = norm(input.value);
    const rows = [];
    for (const [country, cities] of MISSIONS) {
      const byCountry = !q || norm(country).includes(q);
      const hitCity = q ? cities.find(([city]) => norm(city).includes(q)) : null;
      if (!byCountry && !hitCity) continue;
      rows.push(h('button', { class: 'option country' + (country === cState.country ? ' on' : ''), type: 'button', role: 'option',
        onclick: () => choose(country, hitCity && !byCountry ? hitCity[0] : null) },
        h('b', { text: country }), h('small', { text: cities.map(([c]) => c).join('، ') })));
    }
    list.replaceChildren(...rows);
    if (!rows.length) list.append(h('p', { class: 'empty', text: u.noMatch }));
  };
  input.addEventListener('input', draw);
  draw();
  sheet(h('div', { class: 'picker' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.cCountry }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    input, list), { tall: true });
  if (!matchMedia('(pointer: coarse)').matches) input.focus();
}
function missionSelect() {
  const u = t();
  const c = MISSIONS.find(([n]) => n === cState.country);
  const list = c ? c[1] : [];
  const sel = h('select', { class: 'input select', id: 'c_city', 'aria-label': u.cMission },
    list.map(([city, type]) => h('option', { value: city, text: `${type === 'C' ? u.cConsulateGen : u.cEmbassy} - ${city}` })));
  sel.value = cState.city;
  sel.addEventListener('change', () => { cState.city = sel.value; cState.consulate = templateOf(); cSave(); renderConsular(true); });
  return sel;
}

function renderConsular(keepScroll) {
  app.section = 'forms'; persistSection();
  const u = t();
  const y = scrollY;
  suggesters.clear();
  cPrefill();
  const pick = (options, current, onPick) => h('div', { class: 'chips big' }, Object.entries(options).map(([id, name]) =>
    h('button', { class: 'chipbtn' + (current === id ? ' on' : ''), type: 'button', text: name, onclick: () => onPick(id) })));
  if (cState.form === 'apostille' && cState.country !== 'ألمانيا') cState.form = 'poa';
  if (cState.form === 'gpoa' && cState.consulate !== 'frankfurt') cState.form = 'poa';
  if (cState.form === 'poa' && cState.consulate === 'frankfurt' && cState.values.purposeType === 'generalCustom') { cState.form = 'gpoa'; cState.values.gpoaType = 'custom'; cState.values.purposeType = 'records'; cState.values.purpose = purposeText(); }
  const keys = cState.form === 'apostille' ? C_FIELDS.apostille : C_FIELDS[`${cState.consulate}.${cState.form}`];
  const formOptions = cState.consulate === 'frankfurt' ? { poa: u.cPoaSpecial, gpoa: u.cForms.gpoa, life: u.cForms.life, apostille: u.cForms.apostille }
    : cState.country === 'ألمانيا' ? { poa: u.cForms.poa, life: u.cForms.life, apostille: u.cForms.apostille } : { poa: u.cForms.poa, life: u.cForms.life };
  const docs = C_REQUIRED[cState.form];
  $('#app').replaceChildren(
    header(), newsTicker(), tabs(),
    h('main', { class: 'cards consular' },
      h('p', { class: 'note', text: u.cIntro }),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' },
        h('p', { class: 'qlabel', text: u.cCountry }), countrySelect(),
        h('div', { class: 'cwelcome' },
          h('p', { text: u.cWelcome(cState.country) }),
          h('button', { class: 'btn soft', type: 'button', text: u.cWelcomeBtn, onclick: () => {
            count('country_help', { country: cState.country });
            openRequest(null, `مساعدة للعراقيين في ${cState.country}`);
          } })),
        cState.form === 'apostille' ? null : h('p', { class: 'qlabel', text: u.cMission }),
        cState.form === 'apostille' ? null : missionSelect(),
        cState.form === 'apostille' ? null : noForm() ? h('p', { class: 'notice', text: u.cNoForm(currentMission()) })
          : cState.consulate === 'generic' ? h('p', { class: 'hint', text: u.cGenericNote }) : null,
        h('p', { class: 'qlabel', text: u.cForm }),
        pick(formOptions, cState.form, (id) => { cState.form = id; cSave(); renderConsular(true); }),
        cState.form === 'apostille' ? h('p', { class: 'notice', text: u.cApostilleNote }) : null,
        cState.form === 'gpoa' ? h('p', { class: 'notice', text: u.cGpoaNote }) : null,
        videoBtn('consular_' + cState.form))),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' },
        h('div', { class: 'qhead' },
          h('p', { class: 'qlabel', text: u.cInfo }),
          h('button', { class: 'btn ghost small', type: 'button', text: u.cClear, onclick: () => {
            if (!confirm(u.cConfirmClear)) return;
            cClear(); renderConsular(true); toast(u.cCleared); count('consular_clear');
          } })),
        keys.map(cField))),
      cState.form === 'apostille' ? null : bookingCard(),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' },
        checklist('c:' + cState.form, docs.map(([ar, ku]) => (app.lang === 'Kur' ? ku : ar))),
        h('p', { class: 'hint', text: u.cRequiredNote }),
        cState.form === 'apostille' ? null : apptButton('c:' + cState.form, currentMission()))),
      disclaimerNote()),
    h('div', { class: 'dock' }, h('button', { class: 'btn primary wide big', type: 'button', text: noForm() ? u.cOptionalSheet : u.review, onclick: () => cGoReview() })),
    bottomNav(),
  );
  if (keepScroll) scrollTo(0, y);
}

// ---------- booking assistant (the person books on the official site) ----------
const ICASS_URL = 'https://icass.mofa.gov.iq/#/';
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {
    const ta = h('textarea', { class: 'offscreen' }); ta.value = text; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (err) { /* ignore */ }
    ta.remove(); return ok;
  }
}
function bookingCard() {
  const u = t();
  const v = cState.values;
  const f = app.values || {};
  if (!v.gender && (f.a01gender === 'm' || f.a01gender === 'f')) v.gender = f.a01gender;
  const birth = v.birthDate || f.a05birthDate || '';
  const address = v.homeAddress || [v.street, v.plzCity].filter(Boolean).join('، ') || v.principalAddress || '';
  const mission = currentMission();
  const items = [
    ['name', v.principal], ['mother', v.mother], ['gender', v.gender ? u.bkGender[v.gender] : ''],
    ['birth', birth ? birth.split('-').reverse().join('/') : ''], ['email', v.bookingEmail], ['address', address],
  ];
  const email = h('input', { class: 'input', id: 'c_bookingEmail', type: 'email', dir: 'ltr', autocomplete: 'email', inputmode: 'email' });
  email.value = v.bookingEmail || '';
  email.addEventListener('change', () => { v.bookingEmail = email.value.trim(); cSave(); renderConsular(true); });
  const genderChips = h('div', { class: 'chips' }, Object.entries(u.bkGender).map(([id, name]) => h('button', {
    class: 'chipbtn' + (v.gender === id ? ' on' : ''), type: 'button', text: name,
    onclick: () => { v.gender = id; cSave(); renderConsular(true); } })));
  return h('section', { class: 'card open booking' }, h('div', { class: 'card-body flat' },
    h('p', { class: 'qlabel', text: u.bkTitle }),
    h('p', { class: 'hint', text: u.bkIntro }),
    videoBtn('booking'),
    h('ol', { class: 'steps' }, u.bkSteps.map((st) => h('li', { text: typeof st === 'function' ? st(mission) : st }))),
    h('a', { class: 'btn primary wide', href: ICASS_URL, target: '_blank', rel: 'noopener', onclick: () => count('booking_site_open', { city: cState.city }) }, u.bkOpen),
    h('div', { class: 'field' }, h('label', { text: u.bkLabels.gender }), genderChips),
    h('div', { class: 'field' }, h('label', { for: 'c_bookingEmail', text: u.bkEmail }), email),
    h('p', { class: 'qlabel', text: u.bkCopyTitle }),
    h('div', { class: 'copylist' }, items.map(([key, value]) => h('div', { class: 'copyrow' },
      h('div', { class: 'copytext' }, h('small', { text: u.bkLabels[key] }), h('b', { text: value || u.bkEmpty, class: value ? '' : 'none' })),
      value ? h('button', { class: 'btn soft copybtn', type: 'button', text: u.bkCopy, onclick: async () => {
        if (await copyText(value)) { toast(u.bkCopied); count('booking_copy', { field: key }); }
      } }) : null))),
    h('button', { class: 'btn ghost wide', type: 'button', text: u.bkHelp, onclick: () => openRequest(cState.form === 'life' ? 'life' : 'poa', UI.Ara.bkHelpNote(mission)) }),
  ));
}

function cGoReview(checked) {
  const need = cState.form === 'apostille' ? ['firstName', 'lastName', 'street', 'plzCity'] : ['principal', 'agent'];
  const miss = need.filter((k) => !(cState.values[k] || '').trim());
  if (miss.length) {
    miss.forEach((k) => { const f = document.querySelector(`[data-c="${k}"]`); if (f) { f.classList.add('bad'); if (!f.querySelector('.err')) f.append(h('p', { class: 'err', text: t().fillThis })); } });
    const first = document.querySelector(`[data-c="${miss[0]}"]`); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (!checked) {
    const warns = cWarnings();
    if (warns.length) { showWarnings(warns, goToCField, () => cGoReview(true)); return; }
  }
  count('consular_form', { mission: `${cState.country} - ${cState.city}`, form: cState.form });
  app.cReview = true;
  history.pushState({ creview: true }, '');
  renderConsularReview();
}

const iraqEmblem = new Image();
iraqEmblem.src = 'img/iraq-emblem.png';
async function cPaint(scale) {
  await consularFontsReady();
  if (!iraqEmblem.complete) await new Promise((r) => { iraqEmblem.onload = iraqEmblem.onerror = r; });
  const c = document.createElement('canvas');
  drawConsular(c, { consulate: cState.consulate, form: cState.form, values: cValues(), emblem: iraqEmblem, scale });
  return c;
}

let cCanvas = null;
async function renderConsularReview() {
  app.section = 'forms';
  const u = t();
  const preview = h('img', { class: 'paper', alt: u.cReviewTitle });
  const service = cState.form === 'poa' || cState.form === 'gpoa' ? 'poa' : cState.form === 'apostille' ? 'legal' : 'life';
  const formName = cState.form === 'apostille' ? u.cForms.apostille : `${u.cForms[cState.form]} - ${currentMission()}`;
  const who = cState.form === 'apostille' ? [cState.values.firstName, cState.values.lastName].filter(Boolean).join('-') : (cState.values.principal || '').trim();
  const formNameAr = cState.form === 'apostille' ? UI.Ara.cForms.apostille : `استمارة ${UI.Ara.cForms[cState.form]} (${currentMission()})${who ? ' باسم ' + who : ''}`;
  const fname = (ext) => `${UI.Ara.cForms[cState.form]}${cState.form === 'apostille' ? '' : '-' + cState.city}-${who.replace(/\s+/g, '-')}.${ext}`;
  $('#app').replaceChildren(
    header(),
    tabs(),
    h('main', { class: 'review' },
      h('div', { class: 'two topnav' },
        h('button', { class: 'btn ghost', type: 'button', text: '→ ' + u.backEdit, onclick: () => history.back() }),
        h('button', { class: 'btn primary', type: 'button', text: u.newPerson, onclick: () => {
          if (!confirm(u.cConfirmClear)) return;
          cClear(); app.cReview = false; history.replaceState(null, ''); renderConsular(); scrollTo(0, 0); toast(u.cCleared);
        } })),
      h('h2', { text: u.cReviewTitle }),
      h('p', { class: 'note', text: `${formName}. ${u.cReviewNote}` }),
      h('button', { class: 'paper-btn', type: 'button', 'aria-label': u.tapZoom, onclick: () => {
        if (!cCanvas) return;
        sheet(h('div', { class: 'zoom' }, h('img', { src: cCanvas.toDataURL('image/png'), alt: '' }),
          h('button', { class: 'btn primary wide', type: 'button', text: u.close, onclick: closeSheet })), { tall: true });
      } }, preview),
      h('p', { class: 'hint center', text: u.tapZoom }),
      h('button', { class: 'btn wa wide', type: 'button', text: u.shareForm, onclick: (e) => sharePdf(e.currentTarget, cPaint, fname('pdf'), 'consular') }),
      cState.form === 'life' ? h('button', { class: 'btn soft wide', type: 'button', text: u.remindBtn, onclick: openReminder }) : null,
      printMailCard(formNameAr),
      h('div', { class: 'owner-card' },
        h('div', { class: 'oc-head' }, h('img', { src: OWNER.photo, alt: '', width: 52, height: 52 }),
          h('div', {}, h('b', { text: OWNER.name[app.lang] }), h('p', { text: u.helpTitle }))),
        h('button', { class: 'btn primary wide', type: 'button', text: u.cSubmit, onclick: () =>
          openRequest(service, cState.form === 'apostille' ? `${UI.Ara.cForms.apostille} (الخارجية الألمانية)` : `${UI.Ara.cForms[cState.form]} - ${currentMission()}${cState.form === 'poa' && cState.values.purposeType !== 'custom' ? ' (' + UI.Ara.cPurposeTypes[cState.values.purposeType] + ')' : ''}${cState.form === 'gpoa' ? ' (' + UI.Ara.cGpoaTypes[cState.values.gpoaType === 'custom' ? 'custom' : 'full'] + ')' : ''}، الوكيل: ${cState.values.agent || ''}`) }),
        h('p', { class: 'trust small', html: ICON.check }, u.noUpfront)),
      h('button', { class: 'btn soft wide', type: 'button', text: u.cNew, onclick: () => {
        if (!confirm(u.cConfirmClear)) return;
        cClear(); app.cReview = false; history.replaceState(null, ''); renderConsular(); scrollTo(0, 0); toast(u.cCleared);
      } })),
    h('div', { class: 'dock grid' },
      h('button', { class: 'btn primary', type: 'button', text: u.saveImg, onclick: (e) => cExport('png', e.currentTarget, fname) }),
      h('button', { class: 'btn primary', type: 'button', text: u.savePdf, onclick: (e) => cExport('pdf', e.currentTarget, fname) }),
      h('button', { class: 'btn ghost', type: 'button', text: u.edit, onclick: () => history.back() }),
      h('button', { class: 'btn ghost', type: 'button', text: u.print, onclick: async () => {
        count('consular_print'); const c = await cPaint(2.5); const img = $('#print-page'); img.src = c.toDataURL('image/png');
        await img.decode().catch(() => {}); window.print(); } })),
    bottomNav(),
  );
  scrollTo(0, 0);
  cCanvas = await cPaint(2);
  preview.src = cCanvas.toDataURL('image/png');
  $('#print-page').src = preview.src;
}

async function cExport(kind, btn, fname) {
  if (busy) return;
  busy = true;
  const label = btn.textContent;
  btn.textContent = t().preparing; btn.disabled = true;
  try {
    const big = await cPaint(2.5);
    const blob = await new Promise((res) => big.toBlob(res, kind === 'png' ? 'image/png' : 'image/jpeg', 0.92));
    afterSave = () => afterDone(cState.form);
    const ok = kind === 'png' ? await hand(blob, fname('png'))
      : await hand(jpegPagePdf(new Uint8Array(await blob.arrayBuffer()), big.width, big.height), fname('pdf'));
    if (ok) { if (isIOS()) toast(t().saved); count('consular_saved', { kind, form: cState.form }); tally(`c:${cState.form}:${new Date().toISOString().slice(0, 10)}`, 'f'); if (isIOS()) afterDone(cState.form); }
  } catch (e) { console.error(e); toast(t().failed); }
  finally { busy = false; btn.textContent = label; btn.disabled = false; }
}

// ---------- sections and bottom navigation ----------
const SECTION_KEY = 'bitaqa.section';
function persistSection() { try { localStorage.setItem(SECTION_KEY, app.section); } catch (e) { /* ignore */ } }
const NAV_ICON = {
  home: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
  forms: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M6 3h8l4 4v14H6z M14 3v4h4 M9 12h6 M9 16h6"/></svg>',
  guide: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 21V5 M8 7h7"/></svg>',
  services: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 8h16v12H4z M9 8V5h6v3 M4 13h16"/></svg>',
};
// Each move between sections/tabs is a browser history entry, so the phone's
// back button goes to the previous screen instead of closing the app.
const navState = () => ({ nav: 1, section: app.section, view: app.view });
function navPush() { try { history.pushState(navState(), ''); } catch (e) { /* ignore */ } }
// One consistent line-icon set for tiles, guide rows and services.
const svgI = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICONS = {
  chat: svgI('<path d="M4 5h16v11H9l-5 4z"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.7-.9 1.3M12 14.6v.1"/>'),
  car: svgI('<path d="M5 17h14v-4l-2-5H7l-2 5z"/><path d="M5 13h14"/><circle cx="8" cy="17.5" r="1.6"/><circle cx="16" cy="17.5" r="1.6"/>'),
  cap: svgI('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/>'),
  stamp: svgI('<path d="M9 3h6l-1 7h-4z"/><path d="M5 14h14v3H5zM6 20h12"/>'),
  suitcase: svgI('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18"/>'),
  idcard: svgI('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.7-1.6 1.8-2.3 3.2-2.3s2.5.7 3.2 2.3M14.5 10h4M14.5 13.5h3"/>'),
  doc: svgI('<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 16h6"/>'),
  book: svgI('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 7h8M8 10.5h5"/>'),
  briefcase: svgI('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 12.5h18M11 12.5v2h2v-2"/>'),
  passport: svgI('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10.5" r="3.2"/><path d="M8.8 10.5h6.4M12 7.3c1 1 1 5.4 0 6.4M12 7.3c-1 1-1 5.4 0 6.4M9 17h6"/>'),
  shield: svgI('<path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/>'),
  baby: svgI('<circle cx="12" cy="7" r="3.5"/><path d="M6.5 21v-3.5a5.5 5.5 0 0 1 11 0V21M10.5 7h.01M13.5 7h.01"/>'),
  rings: svgI('<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 5l2-2 2 2"/>'),
  plane: svgI('<path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>'),
  wallet: svgI('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="17" height="12" rx="2"/><path d="M16 14h2"/>'),
  scale: svgI('<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>'),
  printer: svgI('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
  pen: svgI('<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/><path d="M13.5 6.5l3 3"/>'),
  flag: svgI('<path d="M5 21V4"/><path d="M5 4h13l-2.5 4L18 12H5"/>'),
  menu: svgI('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  calendar: svgI('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h3v3H8z"/>'),
};
const GUIDE_ICON = { passport: 'passport', record: 'shield', birth: 'baby', marriage: 'rings', laissez: 'plane', licence: 'car', degree: 'cap', iqdocs: 'stamp', travel: 'suitcase' };
function goSection(sec, fromHistory) {
  closeSheet();
  app.section = sec; persistSection();
  if (!fromHistory) count('nav', { to: sec });
  renderCurrent(); scrollTo(0, 0);
  if (!fromHistory) navPush();
}
function bottomNav() {
  const u = t();
  const item = (sec, label) => h('button', { class: 'navbtn' + (app.section === sec ? ' on' : ''), type: 'button', 'aria-current': app.section === sec ? 'page' : null,
    onclick: () => { if (app.section === sec && sec !== 'forms') { scrollTo(0, 0); return; } goSection(sec); } },
    h('i', { html: NAV_ICON[sec] }), h('span', { text: label }));
  return h('nav', { class: 'bottomnav', 'aria-label': u.appName },
    item('home', u.navHome), item('forms', u.navForms), item('guide', u.navGuide), item('services', u.navServices));
}
function openForms(view) {
  app.view = view; persistView();
  app.review = false; app.cReview = false;
  goSection('forms');
}
function renderHome() {
  const u = t();
  const tile = (key, onclick, cls = '') => h('button', { class: 'tile ' + cls, type: 'button', onclick: () => { count('home_tile', { tile: key }); onclick(); } },
    h('i', { html: ICONS[{ nid: 'idcard', consular: 'doc', guide: 'book', services: 'briefcase' }[key]] }),
    h('b', { text: u.homeTiles[key][0] }), h('small', { text: u.homeTiles[key][1] }));
  const hot = (icon, title, sub, onclick) => h('button', { class: 'hotcard', type: 'button', onclick },
    h('span', { class: 'hot-top' }, h('i', { html: ICONS[icon] })),
    h('b', { text: title }), h('small', { text: sub }));
  const cur = currentForm();
  const started = cur && Object.keys(cur.values || {}).length;
  $('#app').replaceChildren(
    header(),
    newsTicker(),
    noticeCards(),
    h('main', { class: 'home' },
      nextApptCard(),
      notifPromo(),
      started ? h('button', { class: 'continue', type: 'button', onclick: () => openForms('nid') },
        h('b', { text: u.homeContinue(personName(cur.values)) }),
        h('small', { text: formMissing(cur.values) ? `${u.formMissing} (${formMissing(cur.values)})` : u.formDone })) : null,
      h('h2', { class: 'home-ask', text: u.homeAsk }),
      h('div', { class: 'tiles' },
        tile('nid', () => openForms('nid'), 'main'),
        tile('consular', () => openForms('consular'), 'main'),
        tile('guide', () => goSection('guide')),
        tile('services', () => goSection('services'))),
      h('div', { class: 'hots' },
        h('button', { class: 'hotcard wide qa-home', type: 'button', onclick: () => { count('home_tile', { tile: 'qa' }); openQA(); } },
          h('span', { class: 'hot-top' }, h('i', { html: ICONS.chat }), h('em', { text: u.quickNew })),
          h('b', { text: u.qaTitle }), h('small', { text: u.qaShort })),
        hot('wallet', u.pnTitle, u.pnShort, openPension),
        hot('plane', u.tvTitle, u.tvShort, openTvisa),
        h('button', { class: 'hotcard wide natur-hot', type: 'button', onclick: openNatur },
          h('span', { class: 'hot-top' }, h('i', { html: ICONS.flag })),
          h('b', { text: (NATUR[app.lang] || NATUR.Ara).title }), h('small', { text: (NATUR[app.lang] || NATUR.Ara).short }))),
      meRibbon(),
      promoBanner(),
      disclaimerNote()),
    bottomNav(),
  );
}
function renderGuide() {
  const u = t();
  const row = (icon, title, short, onclick) => h('button', { class: 'gcard', type: 'button', onclick },
    h('span', { class: 'gicon', html: ICONS[icon] }),
    h('span', { class: 'gtext' }, h('b', { text: title }), h('small', { text: short })),
    h('i', { html: ICON.chevron }));
  $('#app').replaceChildren(
    header(),
    newsTicker(),
    h('main', { class: 'page' },
      h('h2', { text: u.gTitle }),
      h('p', { class: 'note', text: u.gIntro }),
      h('button', { class: 'qa-hot', type: 'button', onclick: () => openQA() },
        h('span', { class: 'gicon', html: ICONS.chat }),
        h('span', { class: 'gtext' }, h('b', { text: u.qaTitle }), h('small', { text: u.qaShort })),
        h('i', { html: ICON.chevron })),
      h('h3', { class: 'ggroup', text: u.gGroups.iq }),
      h('div', { class: 'glist' },
        GUIDES.filter((g) => !g.group).map((g) => row(GUIDE_ICON[g.id] || 'doc', g[app.lang].title, g[app.lang].short, () => openGuide(g.id))),
        row('wallet', u.pnTitle, u.pnShort, openPension)),
      h('h3', { class: 'ggroup', text: u.gGroups.de }),
      h('div', { class: 'glist' },
        GUIDES.filter((g) => g.group === 'de').map((g) => row(GUIDE_ICON[g.id] || 'doc', g[app.lang].title, g[app.lang].short, () => openGuide(g.id))),
        row('flag', (NATUR[app.lang] || NATUR.Ara).title, (NATUR[app.lang] || NATUR.Ara).short, openNatur)),
      h('h3', { class: 'ggroup', text: u.gGroups.travel }),
      h('div', { class: 'glist' },
        GUIDES.filter((g) => g.group === 'travel').map((g) => row(GUIDE_ICON[g.id] || 'doc', g[app.lang].title, g[app.lang].short, () => openGuide(g.id))),
        row('plane', u.tvTitle, u.tvShort, openTvisa)),
      disclaimerNote()),
    bottomNav(),
  );
}
function renderServices() {
  const u = t();
  const design = UI.Ara.promos.find((p) => p.key === 'design');
  const SV_ICON = { booking: 'calendar', passport: 'passport', lawyer: 'scale', printmail: 'printer', tvisa: 'plane', design: 'pen' };
  const sv = (key, onclick) => h('button', { class: 'svbtn', type: 'button', onclick: () => { count('service_click', { item: key }); onclick(); } },
    h('i', { html: ICONS[SV_ICON[key]] }), h('span', { text: u.svItems[key] }));
  $('#app').replaceChildren(
    header(),
    newsTicker(),
    h('main', { class: 'page' },
      h('h2', { text: u.svTitle }),
      h('p', { class: 'note', text: u.svIntro }),
      h('p', { class: 'trust', html: ICON.check }, u.noUpfront),
      h('button', { class: 'btn primary wide big', type: 'button', text: u.svRequest, onclick: () => openRequest(null) }),
      h('div', { class: 'svgrid' },
        sv('booking', () => openRequest(null)),
        sv('passport', () => openRequest('passport')),
        sv('lawyer', () => openRequest('lawyer')),
        sv('printmail', () => openRequest('printmail')),
        sv('tvisa', openTvisa),
        sv('design', () => window.open(waLink(design ? design.msg : u.waHello), '_blank', 'noopener'))),
      h('a', { class: 'btn soft wide', href: '/track.html', onclick: () => count('track_open') }, u.myCases),
      h('a', { class: 'btn wa wide', href: waLink(u.waHello), target: '_blank', rel: 'noopener', html: ICON.wa, onclick: () => count('whatsapp_click', { place: 'services' }) }, u.whatsapp),
      meRibbon(),
      h('div', { class: 'two' },
        h('a', { class: 'btn tt', href: OWNER.tiktok, target: '_blank', rel: 'noopener', html: ICON.tt, onclick: () => count('tiktok_click', { place: 'services' }) }, u.tiktok),
        h('a', { class: 'btn fb', href: OWNER.facebook, target: '_blank', rel: 'noopener', html: ICON.fb, onclick: () => count('facebook_click', { place: 'services' }) }, u.facebook)),
      h('div', { class: 'two' },
        h('button', { class: 'btn soft', type: 'button', text: u.saveContact, onclick: saveContact }),
        h('button', { class: 'btn soft', type: 'button', text: u.shareApp, onclick: shareApp })),
      disclaimerNote()),
    bottomNav(),
  );
}

// ---------- light / dark ----------
const THEME_KEY = 'bitaqa.theme';
const themePref = () => { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch (e) { return 'auto'; } };
function applyTheme(pref) {
  try { localStorage.setItem(THEME_KEY, pref); } catch (e) { /* ignore */ }
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dk', dark);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0B1622' : '#173F5F');
}
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (themePref() === 'auto') applyTheme('auto'); }); } catch (e) { /* old browsers */ }

const APP_VERSION = '2.0';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.hushamahmed.bitaqa';
const isAndroid = () => /android/i.test(navigator.userAgent);

function infoSheet(title, text) {
  sheet(h('div', { class: 'msg' }, h('h2', { text: title }), h('p', { text }),
    h('button', { class: 'btn primary wide', type: 'button', text: t().close, onclick: closeSheet })));
}

// ---------- phone notifications ----------
async function turnOnPush() {
  const u = t();
  if (!pushSupported()) { infoSheet(u.notifLabel, u.notifUnsupported); return false; }
  if (needsInstall()) { infoSheet(u.notifLabel, u.notifIos); return false; }
  const r = await enablePush(app.lang);
  if (r === 'on') { toast(u.notifDone); count('push_on'); return true; }
  if (r === 'denied') infoSheet(u.notifLabel, u.notifDenied);
  else toast(r === 'unsupported' ? u.notifUnsupported : u.notifFailed, 5000);
  count('push_fail', { r });
  return false;
}
const NOTIF_ASK = 'bitaqa.notifAsk';
// A card on the home screen until notifications are on (or "not now", asked again after 3 weeks).
function notifPromo() {
  if (!pushSupported() && !needsInstall()) return null;
  let later = 0;
  try { later = Number(localStorage.getItem(NOTIF_ASK)) || 0; } catch (e) { /* ignore */ }
  if (Date.now() - later < 21 * 864e5) return null;
  const u = t();
  const card = h('div', { class: 'notif-card', hidden: true },
    h('b', { text: u.notifCardTitle }),
    h('p', { text: u.notifCardText }),
    h('div', { class: 'two' },
      h('button', { class: 'btn primary', type: 'button', text: u.notifEnable, onclick: async () => { if (await turnOnPush()) card.remove(); } }),
      h('button', { class: 'btn ghost', type: 'button', text: u.notifLater, onclick: () => {
        try { localStorage.setItem(NOTIF_ASK, String(Date.now())); } catch (e) { /* ignore */ }
        card.remove(); count('push_later');
      } })));
  pushOn().then((on) => { if (!on) card.hidden = false; else card.remove(); });
  return card;
}

// ---------- "more" menu ----------
async function openMore() {
  const u = t();
  count('more_open');
  const themeRow = h('div', { class: 'chips' }, ['auto', 'light', 'dark'].map((k) => h('button', {
    class: 'chipbtn' + (themePref() === k ? ' on' : ''), type: 'button', text: u.themes[k],
    onclick: (e) => { applyTheme(k); [...themeRow.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); count('theme', { k }); } })));
  const state = h('small', { class: 'state', text: '…' });
  const nbtn = h('button', { class: 'btn soft wide', type: 'button', text: u.notifEnable });
  const refresh = async () => {
    const on = await pushOn();
    state.textContent = on ? u.notifOnState : u.notifOffState;
    state.classList.toggle('on', on);
    nbtn.textContent = on ? u.notifStop : u.notifEnable;
    nbtn.onclick = on ? async () => { await disablePush(); toast(u.notifStopped); count('push_off'); refresh(); }
      : async () => { await turnOnPush(); refresh(); };
  };
  const row = (icon, label, onclick) => h('button', { class: 'more-row', type: 'button', onclick }, h('span', { text: icon }), h('b', { text: label }), h('i', { html: ICON.chevron }));
  sheet(h('div', { class: 'more' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.moreTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { class: 'qlabel', text: u.themeLabel }), themeRow,
    h('div', { class: 'qhead mt' }, h('p', { class: 'qlabel', text: u.notifLabel }), state), nbtn,
    h('div', { class: 'more-list' },
      row('ℹ️', u.aboutApp, () => { closeSheet(); openAboutApp(); }),
      row('👤', u.meTitle, () => { closeSheet(); openAboutMe(); }),
      isAndroid() ? row('⭐', u.rateApp, () => { count('rate_play', { place: 'more' }); window.open(PLAY_URL, '_blank', 'noopener'); }) : null,
      row('📤', u.shareApp, () => { closeSheet(); shareApp(); }),
      row('🔒', u.privacyPolicy, () => { window.open('/privacy.html', '_blank', 'noopener'); })),
    h('p', { class: 'hint center', text: `${u.appVersion} ${APP_VERSION}` }),
  ), { tall: true });
  refresh();
}
function openAboutApp() {
  const u = t();
  count('about_app_open');
  sheet(h('div', { class: 'about' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.aboutApp }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('div', { class: 'about-head' }, h('img', { src: '/icons/icon-192.png', alt: '', width: 72, height: 72 }),
      h('div', {}, h('b', { text: u.appName }), h('small', { text: `${u.appVersion} ${APP_VERSION}` }))),
    u.aboutAppText.map((x) => h('p', { text: x })),
    h('ul', { class: 'docs' }, u.aboutFeatures.map((x) => h('li', { text: x }))),
    isAndroid() ? h('a', { class: 'btn primary wide', href: PLAY_URL, target: '_blank', rel: 'noopener', onclick: () => count('rate_play', { place: 'about' }) }, u.ratePlay) : null,
    h('div', { class: 'two' },
      h('button', { class: 'btn soft', type: 'button', text: u.shareApp, onclick: shareApp }),
      h('button', { class: 'btn soft', type: 'button', text: u.meTitle, onclick: () => { closeSheet(); openAboutMe(); } })),
    h('a', { class: 'btn ghost wide', href: '/privacy.html', target: '_blank', rel: 'noopener', text: u.privacyPolicy }),
  ), { tall: true });
}

// ---------- my file: document checklists and appointments (kept on this device) ----------
const MINE_KEY = 'bitaqa.mine.v1';
function mine() {
  try { const m = JSON.parse(localStorage.getItem(MINE_KEY) || '{}'); return { checks: m.checks || {}, appts: Array.isArray(m.appts) ? m.appts : [] }; } catch (e) { return { checks: {}, appts: [] }; }
}
function saveMine(m) { try { localStorage.setItem(MINE_KEY, JSON.stringify(m)); } catch (e) { /* ignore */ } }
const ymdLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysUntil = (date) => Math.round((new Date(`${date}T00:00`) - new Date(`${ymdLocal()}T00:00`)) / 864e5);

function checklist(key, items) {
  const u = t();
  const done = new Set(mine().checks[key] || []);
  const prog = h('small', { class: 'check-prog' });
  const upd = () => { const n = items.filter((_, i) => done.has(i)).length; prog.textContent = u.checkProgress(n, items.length); prog.classList.toggle('all', n === items.length); };
  const list = h('ul', { class: 'checks' }, items.map((txt, i) => {
    const cb = h('input', { type: 'checkbox' });
    cb.checked = done.has(i);
    cb.addEventListener('change', () => {
      if (cb.checked) done.add(i); else done.delete(i);
      const m = mine(); m.checks[key] = [...done]; saveMine(m); upd();
      if (cb.checked) count('check_item', { key });
    });
    return h('li', {}, h('label', {}, cb, h('span', { text: txt })));
  }));
  upd();
  return h('div', { class: 'checkcard' }, h('div', { class: 'qhead' }, h('p', { class: 'qlabel', text: u.checkTitle }), prog), list, h('p', { class: 'hint', text: u.checkHint }));
}

// Which screen an appointment belongs to: g:<guide id>, c:<consular form>, nid.
function apptLabel(key) {
  const u = t();
  if (key.startsWith('g:')) { const g = findGuide(key.slice(2)); return g ? (g[app.lang] || g.Ara).title : ''; }
  if (key.startsWith('c:')) return u.cForms[key.slice(2)] || '';
  return u.homeTiles.nid[0];
}
function apptItems(key) {
  if (key.startsWith('g:')) { const g = findGuide(key.slice(2)); return g ? (g[app.lang] || g.Ara).need : []; }
  if (key.startsWith('c:')) return (C_REQUIRED[key.slice(2)] || []).map(([ar, ku]) => (app.lang === 'Kur' ? ku : ar));
  return t().nidNeed;
}
function openApptTarget(key) {
  closeSheet();
  if (key.startsWith('g:')) { openGuide(key.slice(2)); return; }
  if (key.startsWith('c:')) { cState.form = key.slice(2); cSave(); openForms('consular'); return; }
  openForms('nid');
}
function apptButton(key, place) {
  return h('button', { class: 'btn soft wide appt-btn', type: 'button', text: t().apptBtn, onclick: () => openAppt(key, place) });
}
function icsFor(a) {
  const u = t();
  const esc = (x) => String(x).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const enc = new TextEncoder();
  const fold = (line) => { let out = ''; let n = 0; for (const ch of line) { const b = enc.encode(ch).length; if (n + b > 73) { out += '\r\n '; n = 1; } out += ch; n += b; } return out; };
  const d = a.date.replace(/-/g, '');
  const next = ymdLocal(new Date(new Date(`${a.date}T12:00`).getTime() + 864e5)).replace(/-/g, '');
  const [hh, mm] = (a.time || '').split(':');
  const start = a.time ? `DTSTART:${d}T${hh}${mm}00` : `DTSTART;VALUE=DATE:${d}`;
  const end = a.time ? `DTEND:${d}T${String(Math.min(23, Number(hh) + 1)).padStart(2, '0')}${mm}00` : `DTEND;VALUE=DATE:${next}`;
  const title = u.apptCalTitle(a.label);
  const text = `${u.apptOpen}:\n${apptItems(a.key).map((x) => `- ${x}`).join('\n')}\n\n${location.origin}`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//husham-ahmed//bitaqa//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    `UID:${a.id}@husham-ahmed.vercel.app`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, start, end,
    `SUMMARY:${esc(title)}`, a.place ? `LOCATION:${esc(a.place)}` : null, `DESCRIPTION:${esc(text)}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(title)}`, 'TRIGGER:-P1D', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).map(fold).join('\r\n');
}
function downloadIcs(a) {
  const url = URL.createObjectURL(new Blob([icsFor(a)], { type: 'text/calendar;charset=utf-8' }));
  if (isIOS()) location.href = url;
  else { const el = h('a', { href: url, download: 'موعد.ics' }); document.body.append(el); el.click(); el.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  count('appt_calendar');
}
function openAppt(key, place) {
  const u = t();
  const label = apptLabel(key);
  // The phone's own date box shows broken Arabic placeholders ("موي/رهش"), so the
  // native input is kept invisible on top of our own text and only opens the picker.
  const dateText = h('span', { class: 'date-text empty', text: u.apptPick });
  const date = h('input', { class: 'date-native', type: 'date', id: 'appt_date', min: ymdLocal(), onchange: () => {
    const [y, mo, d] = (date.value || '').split('-');
    dateText.textContent = date.value ? `${+d}/${+mo}/${y}` : u.apptPick;
    dateText.classList.toggle('empty', !date.value);
  } });
  const dateBox = h('div', { class: 'input date-box' }, dateText, h('span', { class: 'date-ico', 'aria-hidden': 'true', text: '📅' }), date);
  const time = h('input', { class: 'input', type: 'time', id: 'appt_time', value: '09:00' });
  const where = h('input', { class: 'input', type: 'text', id: 'appt_place', value: place || '' });
  const err = h('p', { class: 'err' });
  const saveBtn = h('button', { class: 'btn primary wide', type: 'button', text: u.apptSave, onclick: async () => {
    if (!date.value) { err.textContent = u.apptNeedDate; return; }
    if (date.value < ymdLocal()) { err.textContent = u.apptPast; return; }
    saveBtn.disabled = true;
    const a = { id: newId(), key, label, date: date.value, time: time.value || '', place: where.value.trim().slice(0, 80) };
    a.remId = await scheduleReminder({ date: a.date, time: a.time, label, lang: app.lang });
    const m = mine(); m.appts = m.appts.filter((x) => x.key !== key || x.date < ymdLocal()); m.appts.push(a); saveMine(m);
    count('appt_saved', { key, push: !!a.remId });
    apptSaved(a);
  } });
  sheet(h('div', { class: 'msg appt' },
    h('h2', { text: u.apptTitle }),
    h('p', { class: 'note', text: `${u.apptFor}: ${label}` }),
    h('div', { class: 'field' }, h('label', { for: 'appt_date', text: u.apptDate }), dateBox),
    h('div', { class: 'field' }, h('label', { for: 'appt_time', text: u.apptTime }), time),
    h('div', { class: 'field' }, h('label', { for: 'appt_place', text: u.apptPlace }), where),
    err, saveBtn,
    h('button', { class: 'btn ghost wide', type: 'button', text: u.close, onclick: closeSheet })));
}
function apptSaved(a) {
  const u = t();
  const push = h('div', {});
  const fill = (on) => push.replaceChildren(on ? h('p', { class: 'trust', text: u.apptPushOn })
    : h('button', { class: 'btn soft wide', type: 'button', text: u.apptPushAsk, onclick: async () => {
      if (!(await turnOnPush())) return;
      a.remId = await scheduleReminder({ date: a.date, time: a.time, label: a.label, lang: app.lang });
      const m = mine(); m.appts = m.appts.map((x) => (x.id === a.id ? a : x)); saveMine(m);
      fill(!!a.remId);
    } }));
  fill(!!a.remId);
  sheet(h('div', { class: 'msg appt' },
    h('h2', { text: u.apptSaved }),
    h('p', { class: 'note', text: `${a.label} · ${a.date.split('-').reverse().join('/')} ${u.apptAt(a.time)}` }),
    h('button', { class: 'btn primary wide', type: 'button', text: u.apptCal, onclick: () => downloadIcs(a) }),
    push,
    h('button', { class: 'btn ghost wide', type: 'button', text: u.close, onclick: () => { closeSheet(); renderCurrent(); } })));
}
// Home: the next appointment, with how many documents are ready.
function nextApptCard() {
  const today = ymdLocal();
  const m = mine();
  const keep = m.appts.filter((a) => a.date >= today);
  if (keep.length !== m.appts.length) { m.appts = keep; saveMine(m); }
  const a = keep.sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))[0];
  if (!a) return null;
  const u = t();
  const items = apptItems(a.key);
  const ready = (m.checks[a.key] || []).filter((i) => i < items.length).length;
  const days = daysUntil(a.date);
  return h('div', { class: 'appt-card' + (days <= 1 ? ' soon' : '') },
    h('div', { class: 'appt-top' }, h('small', { text: `📅 ${u.apptNext}` }), h('span', { class: 'appt-in', text: u.apptIn(days) })),
    h('b', { text: apptLabel(a.key) || a.label }),
    h('p', { text: [a.date.split('-').reverse().join('/'), u.apptAt(a.time), a.place].filter(Boolean).join(' · ') }),
    items.length ? h('p', { class: 'appt-ready', text: u.checkProgress(ready, items.length) }) : null,
    h('div', { class: 'two' },
      h('button', { class: 'btn primary', type: 'button', text: u.apptOpen, onclick: () => openApptTarget(a.key) }),
      h('button', { class: 'btn ghost', type: 'button', text: u.apptDelete, onclick: () => {
        const mm = mine(); mm.appts = mm.appts.filter((x) => x.id !== a.id); saveMine(mm);
        cancelReminder(a.remId); toast(u.apptDeleted); count('appt_deleted'); renderCurrent();
      } })));
}

// ---------- read an ID photo and fill in the national card form ----------
const SCAN_OK = 'bitaqa.scanConsent';
async function shrinkToJpeg(file, max = 1600) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85).split(',')[1];
  } finally { URL.revokeObjectURL(url); }
}
function openScan() {
  const u = t();
  count('scan_open');
  let agreed = false;
  try { agreed = localStorage.getItem(SCAN_OK) === '1'; } catch (e) { /* ignore */ }
  const consent = h('input', { type: 'checkbox', id: 'scan_ok' });
  consent.checked = agreed;
  const status = h('div', { class: 'scan-status' });
  const cam = h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'offscreen', 'aria-hidden': 'true', tabindex: '-1' });
  const gal = h('input', { type: 'file', accept: 'image/*', class: 'offscreen', 'aria-hidden': 'true', tabindex: '-1' });
  const ok = () => {
    if (consent.checked) { try { localStorage.setItem(SCAN_OK, '1'); } catch (e) { /* ignore */ } return true; }
    status.replaceChildren(h('p', { class: 'err', text: u.scanConsent }));
    consent.focus();
    return false;
  };
  const btnCam = h('button', { class: 'btn primary wide', type: 'button', text: u.scanCamera, onclick: () => { if (ok()) cam.click(); } });
  const btnGal = h('button', { class: 'btn soft wide', type: 'button', text: u.scanGallery, onclick: () => { if (ok()) gal.click(); } });
  const busy = (on) => { btnCam.disabled = on; btnGal.disabled = on; };
  const run = async (file) => {
    busy(true);
    status.replaceChildren(h('p', { class: 'scan-busy' }, h('span', { class: 'spinner' }), u.scanBusy));
    count('scan_start');
    let out;
    try {
      const image = await shrinkToJpeg(file);
      const res = await fetch('/api/scan?a=read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }) });
      if (res.status === 429) { status.replaceChildren(h('p', { class: 'err', text: u.scanSlow })); busy(false); return; }
      out = await res.json();
    } catch (e) { status.replaceChildren(h('p', { class: 'err', text: u.scanOffline })); busy(false); count('scan_error'); return; }
    busy(false);
    if (!out || !out.ok) { status.replaceChildren(h('p', { class: 'err', text: u.scanFail })); count('scan_fail'); return; }
    const values = fillValues(out.fields || {});
    const keys = Object.keys(values);
    if (!keys.length) { status.replaceChildren(h('p', { class: 'err', text: u.scanNone })); count('scan_empty'); return; }
    count('scan_ok', { n: keys.length });
    const L = LABELS[app.lang] || LABELS.Ara;
    const shown = (k) => (FIELDS[k].type === 'pick' ? labelOf(k, values[k]) : values[k]);
    status.replaceChildren(
      h('p', { class: 'scan-found', text: u.scanFound(keys.length, out.doc) }),
      h('ul', { class: 'scan-list' }, keys.map((k) => h('li', {}, h('small', { text: L[k] || k }), h('b', { text: shown(k) })))),
      h('p', { class: 'notice', text: u.scanCheck }),
      h('button', { class: 'btn primary wide', type: 'button', text: u.scanApply, onclick: () => {
        const cur = currentForm() || addForm({});
        cur.values = { ...cur.values, ...values }; cur.scanned = true;
        useForm(cur); persist();
        closeSheet(); renderCurrent();
        toast(u.scanApplied(keys.length), 5000);
        count('scan_applied', { n: keys.length });
      } }),
      h('button', { class: 'btn soft wide', type: 'button', text: u.scanAnother, onclick: () => {
        const cur = currentForm() || addForm({});
        cur.values = { ...cur.values, ...values }; cur.scanned = true;
        useForm(cur); persist();
        status.replaceChildren(h('p', { class: 'trust', text: u.scanApplied(keys.length) }));
        cam.click();
      } }));
  };
  [cam, gal].forEach((inp) => inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.value = ''; if (f) run(f); }));
  sheet(h('div', { class: 'msg scan' },
    h('div', { class: 'picker-top' }, h('h2', { text: u.scanTitle }), h('button', { class: 'x', type: 'button', 'aria-label': u.close, onclick: closeSheet, text: '✕' })),
    h('p', { text: u.scanText }),
    h('p', { class: 'hint', text: u.scanTips }),
    h('label', { class: 'consent', for: 'scan_ok' }, consent, h('span', { text: u.scanConsent })),
    h('p', { class: 'hint', text: u.scanPrivacy }),
    btnCam, btnGal, cam, gal, status), { tall: true });
}

// ---------- screens ----------
function renderForm() {
  app.section = 'forms'; persistSection();
  const root = $('#app');
  root.replaceChildren(
    header(),
    newsTicker(),
    tabs(),
    h('div', { class: 'progress' },
      h('button', { class: 'fambar', type: 'button', onclick: openFamily },
        h('span', { class: 'fambar-who' }, h('small', { text: t().editing }), h('b', { text: personName(app.values) })),
        h('span', { class: 'fambar-btn' }, `${t().family} (${app.forms.length})`)),
      h('p', { id: 'progress-text' }),
      h('div', { class: 'track' }, h('div', { id: 'progress-bar', class: 'fill' })),
      h('button', { class: 'btn scan wide', type: 'button', text: t().scanBtn, onclick: openScan }),
      videoBtn('nid')),
    h('main', { class: 'cards' }, SECTIONS.map(sectionCard),
      disclaimerNote()),
    h('div', { class: 'dock' }, h('button', { class: 'btn primary wide big', type: 'button', text: t().review, onclick: () => goReview() })),
    bottomNav(),
  );
  refreshStatus();
}

function goReview(checked) {
  for (const sec of SECTIONS) {
    const miss = missingIn(sec);
    if (miss.length) {
      app.open = sec.id; persist(); renderForm();
      requestAnimationFrame(() => {
        miss.forEach((k) => { const f = document.querySelector(`.field[data-key="${k}"]`); if (f) { f.classList.add('bad'); if (!f.querySelector('.err')) f.append(h('p', { class: 'err', text: t().fillThis })); } });
        const first = document.querySelector(`.field[data-key="${miss[0]}"]`);
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      if (navigator.vibrate) navigator.vibrate(30);
      return;
    }
  }
  if (!checked) {
    const warns = nidWarnings();
    if (warns.length) { showWarnings(warns, goToNidField, () => goReview(true)); return; }
  }
  count('form_completed');
  tally('f:' + app.current, 'f');
  app.review = true;
  history.pushState({ review: true }, '');
  renderReview();
}

let sheetCanvas = null;
const emblem = new Image();
emblem.src = 'img/emblem.png';

async function paint(scale) {
  await sheetFontsReady();
  if (!emblem.complete) await new Promise((r) => { emblem.onload = emblem.onerror = r; });
  const c = document.createElement('canvas');
  drawSheet(c, { values: displayValues(), record: record(), lang: app.lang, emblem, scale });
  return c;
}

async function renderReview() {
  app.section = 'forms';
  const u = t();
  const preview = h('img', { class: 'paper', alt: u.reviewTitle });
  const root = $('#app');
  root.replaceChildren(
    header(),
    tabs(),
    h('main', { class: 'review' },
      h('div', { class: 'two topnav' },
        h('button', { class: 'btn ghost', type: 'button', text: '→ ' + u.backEdit, onclick: () => history.back() }),
        h('button', { class: 'btn primary', type: 'button', text: u.newPerson, onclick: newPersonForm })),
      h('h2', { text: u.reviewTitle }),
      h('p', { class: 'note', text: u.reviewNote }),
      h('button', { class: 'paper-btn', type: 'button', 'aria-label': u.tapZoom, onclick: zoom }, preview),
      h('p', { class: 'hint center', text: u.tapZoom }),
      h('button', { class: 'btn wa wide', type: 'button', text: u.shareForm, onclick: (e) => sharePdf(e.currentTarget, paint, fileName('pdf'), 'nid') }),
      printMailCard(`استمارة البطاقة الوطنية باسم ${personName(app.values)}`),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' }, checklist('nid', u.nidNeed), apptButton('nid'))),
      h('div', { class: 'owner-card' },
        h('div', { class: 'oc-head' }, h('img', { src: OWNER.photo, alt: '', width: 52, height: 52 }),
          h('div', {}, h('b', { text: OWNER.name[app.lang] }), h('p', { text: u.helpTitle }))),
        h('button', { class: 'btn primary wide', type: 'button', text: u.reqButton, onclick: () => openRequest(null) }),
        h('p', { class: 'trust small', html: ICON.check }, u.noUpfront),
        h('a', { class: 'btn wa wide', href: waLink(u.waHello), target: '_blank', rel: 'noopener', html: ICON.wa, onclick: () => count('whatsapp_click', { place: 'review' }) }, u.whatsapp),
        h('div', { class: 'two' },
          h('button', { class: 'btn soft', type: 'button', text: u.saveContact, onclick: saveContact }),
          h('button', { class: 'btn soft', type: 'button', text: u.shareApp, onclick: shareApp })),
        h('div', { class: 'two' },
          h('a', { class: 'btn fb', href: OWNER.facebook, target: '_blank', rel: 'noopener', html: ICON.fb, onclick: () => count('facebook_click', { place: 'review' }) }, u.facebook),
          h('a', { class: 'btn tt', href: OWNER.tiktok, target: '_blank', rel: 'noopener', html: ICON.tt, onclick: () => count('tiktok_click', { place: 'review' }) }, u.tiktok))),
      promoBanner(),
      h('button', { class: 'btn soft wide', type: 'button', text: `${u.familyBtn} (${app.forms.length})`, onclick: openFamily }),
      disclaimerNote()),
    h('div', { class: 'dock grid' },
      h('button', { class: 'btn primary', type: 'button', text: u.saveImg, onclick: (e) => save('png', e.currentTarget) }),
      h('button', { class: 'btn primary', type: 'button', text: u.savePdf, onclick: (e) => save('pdf', e.currentTarget) }),
      h('button', { class: 'btn ghost', type: 'button', text: u.edit, onclick: () => history.back() }),
      h('button', { class: 'btn ghost', type: 'button', text: u.print, onclick: doPrint })),
    bottomNav(),
  );
  scrollTo(0, 0);
  sheetCanvas = await paint(2);
  preview.src = sheetCanvas.toDataURL('image/png');
  $('#print-page').src = preview.src;
}

// Start an empty form for someone else; the finished one stays in the family list.
function newPersonForm() {
  persist();
  addForm({});
  persist();
  app.review = false;
  history.replaceState(null, '');
  renderForm();
  scrollTo(0, 0);
  toast(t().newPersonDone, 4500);
  count('new_person_form');
}

function zoom() {
  if (!sheetCanvas) return;
  sheet(h('div', { class: 'zoom' }, h('img', { src: sheetCanvas.toDataURL('image/png'), alt: '' }),
    h('button', { class: 'btn primary wide', type: 'button', text: t().close, onclick: closeSheet })), { tall: true });
}

function fileName(ext) {
  const n = [app.values.a07name1, app.values.a06name2, app.values.a09name3].filter(Boolean).join('-').replace(/[\\/:*?"<>|\s]+/g, '-');
  return `${app.lang === 'Kur' ? 'فۆرمی-کارتی-نیشتمانی' : 'استمارة-البطاقة-الوطنية'}${n ? '-' + n : ''}.${ext}`;
}
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// Day and time in the name: Android Chrome stops with "the file already exists" otherwise.
const stamp = () => { const d = new Date(); const p = (x) => String(x).padStart(2, '0'); return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
const withStamp = (name) => name.replace(/(\.[a-z]+)$/i, `-${stamp()}$1`);
async function hand(blob, name) {
  name = withStamp(name);
  if (isIOS() && navigator.canShare) {
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return true; } catch (e) { if (e.name === 'AbortError') return false; throw e; }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  // Android saves straight to «Download» without asking where; say so, and offer the share sheet
  // (WhatsApp, Drive, Files…) for anyone who wants it somewhere else.
  if (!isIOS()) setTimeout(() => savedSheet(blob, name), 600);
  return true;
}
let afterSave = null;   // what to show once the «saved» sheet is closed (rating, share picture)
function savedSheet(blob, name) {
  const next = afterSave; afterSave = null;
  if ($('#veil')) return;
  const u = t();
  const file = new File([blob], name, { type: blob.type });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
  sheet(h('div', { class: 'msg' },
    h('h2', { text: u.savedTitle }),
    h('p', { text: u.savedWhere }),
    h('p', { class: 'hint' }, h('span', { dir: 'ltr', text: '📁 Download' }), h('br'), h('bdi', { text: name })),
    canShare ? h('button', { class: 'btn primary wide', type: 'button', text: u.savedShare, onclick: async () => {
      try { await navigator.share({ files: [file], title: name }); count('saved_shared'); closeSheet(); } catch (e) { /* cancelled */ }
    } }) : null,
    h('button', { class: 'btn ghost wide', type: 'button', text: u.close, onclick: closeSheet })),
  { onClose: () => { if (next) setTimeout(next, 400); } });
}

let busy = false;
async function save(kind, btn) {
  if (busy) return;
  busy = true;
  const label = btn.textContent;
  btn.textContent = t().preparing; btn.disabled = true;
  try {
    const big = await paint(2.5);
    const blob = await new Promise((res) => big.toBlob(res, kind === 'png' ? 'image/png' : 'image/jpeg', 0.92));
    let ok;
    afterSave = () => afterDone('nid');
    if (kind === 'png') ok = await hand(blob, fileName('png'));
    else ok = await hand(jpegPagePdf(new Uint8Array(await blob.arrayBuffer()), big.width, big.height), fileName('pdf'));
    if (ok) { if (isIOS()) toast(t().saved); count(kind === 'png' ? 'saved_image' : 'saved_pdf'); if (isIOS()) afterDone('nid'); }
  } catch (e) {
    console.error(e); toast(t().failed);
  } finally {
    busy = false; btn.textContent = label; btn.disabled = false;
  }
}

async function doPrint() {
  count('print');
  const c = await paint(2.5);
  const img = $('#print-page');
  img.src = c.toDataURL('image/png');
  await img.decode().catch(() => {});
  window.print();
}

// ---------- language, install, start ----------
function setLang(lang) {
  app.lang = lang;
  document.documentElement.lang = lang === 'Ara' ? 'ar' : 'ckb';
  document.title = UI[lang].appName;
  tally('p', 'p');
  persist();
  renderCurrent();
  refreshPushLang(lang);
}

let installEvent = null;
function installBtn() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone || (!installEvent && !isIOS())) return null;
  return h('button', { class: 'chip solid', type: 'button', text: t().install, onclick: async () => {
    if (installEvent) { installEvent.prompt(); await installEvent.userChoice; installEvent = null; renderCurrent(); return; }
    sheet(h('div', { class: 'msg' }, h('h2', { text: t().iosInstallTitle }), h('p', { text: t().iosInstall }),
      h('button', { class: 'btn primary wide', type: 'button', text: t().close, onclick: closeSheet })));
  } });
}
const renderCurrent = () => {
  if (app.section === 'home') return renderHome();
  if (app.section === 'guide') return renderGuide();
  if (app.section === 'services') return renderServices();
  if (app.view === 'consular') return app.cReview ? renderConsularReview() : renderConsular();
  return app.review ? renderReview() : renderForm();
};
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; if (app.lang) renderCurrent(); });
addEventListener('appinstalled', () => { installEvent = null; count('app_installed'); });

addEventListener('popstate', (e) => {
  // Back with a dialog open: just close it, and keep the history in step.
  if ($('#veil')) { closeSheet(); navPush(); return; }
  if (app.section === 'forms' && app.cReview) { app.cReview = false; renderConsular(); scrollTo(0, 0); return; }
  if (app.section === 'forms' && app.review) { app.review = false; renderForm(); scrollTo(0, 0); return; }
  const st = e.state;
  if (st && st.nav) {
    app.review = false; app.cReview = false;
    if (st.view === 'nid' || st.view === 'consular') { app.view = st.view; persistView(); }
    goSection(st.section, true);
    return;
  }
  // Oldest entry: go to the home screen rather than leaving the app.
  app.review = false; app.cReview = false;
  if (app.section !== 'home') { goSection('home', true); try { history.replaceState(navState(), ''); } catch (err) { /* ignore */ } }
});

function welcome(saved) {
  const langBtn = (lang, text) => h('button', { class: 'btn primary', type: 'button', text, onclick: () => {
    closeSheet();
    app.lang = lang;
    loadSaved(saved);
    if (hasData(saved)) askResume(); else setLang(lang);
  } });
  sheet(h('div', { class: 'welcome' },
    h('img', { class: 'welcome-photo', src: OWNER.photo, alt: '', width: 84, height: 84 }),
    h('p', { class: 'muted', text: UI.Ara.freeBy }),
    h('h2', { text: OWNER.name.Ara }),
    h('p', { text: `${UI.Ara.pickLang} / ${UI.Kur.pickLang}` }),
    h('div', { class: 'two' }, langBtn('Ara', 'عربي'), langBtn('Kur', 'کوردی'))));
}

function askResume() {
  const u = UI[app.lang];
  sheet(h('div', { class: 'msg' }, h('h2', { text: u.resumeTitle }), h('p', { text: u.resumeText }),
    h('button', { class: 'btn primary wide', type: 'button', text: u.resume, onclick: () => { closeSheet(); setLang(app.lang); } }),
    h('button', { class: 'btn ghost wide', type: 'button', text: u.startOver, onclick: () => {
      if (!confirm(u.confirmNew)) return;
      resetAll(); closeSheet(); setLang(app.lang); } })));
}

// ---------- live numbers on the home screen (see api/count.js) ----------
// Sends only "p" once per device and "f" once per finished form; no form data.
const TALLY_KEY = 'bitaqa.tallied';
const tallying = new Set();
async function tally(id, k) {
  if (tallying.has(id)) return;
  let done = [];
  try { done = JSON.parse(localStorage.getItem(TALLY_KEY) || '[]'); } catch (e) { /* ignore */ }
  if (done.includes(id)) return;
  tallying.add(id);
  try {
    const res = await fetch('/api/count', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ k }), keepalive: true });
    if (!res.ok) return;
    done.push(id);
    localStorage.setItem(TALLY_KEY, JSON.stringify(done.slice(-300)));
  } catch (e) { /* offline: try again next time */ } finally { tallying.delete(id); }
}
async function loadImpact() {
  try {
    const res = await fetch('/api/count', { cache: 'no-store' });
    if (!res.ok) return;
    const d = await res.json();
    if (!(d.people > 0 && d.forms > 0)) return;
    const now = new Date();
    IMPACT.people = d.people; IMPACT.forms = d.forms; IMPACT.week = Number(d.week) || 0;
    IMPACT.asOf = { Ara: `${UI.Ara.cMonths[now.getMonth()]} ${now.getFullYear()}`, Kur: `${UI.Kur.cMonths[now.getMonth()]} ${now.getFullYear()}` };
    if (app.section === 'home' && !$('#veil') && app.lang) renderHome();
  } catch (e) { /* keep built-in numbers */ }
}

// ---------- live content (news, videos, announcements) ----------
// content.json is edited from the Telegram bot (n8n) and published by Vercel.
// If it cannot be loaded (offline, broken file), the built-in values stay.
async function loadContent() {
  try {
    const res = await fetch('/content.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.news)) NEWS.splice(0, NEWS.length, ...data.news.filter((n) => n && n.Ara));
    if (data.videos && typeof data.videos === 'object') {
      for (const [k, v] of Object.entries(data.videos)) if (typeof v === 'string') VIDEOS[k] = v;
    }
    if (Array.isArray(data.notices)) NOTICES.splice(0, NOTICES.length, ...data.notices.filter((n) => n && n.id && n.text));
    // Refresh only the parts that show this content, so nothing the person is typing is lost.
    const bar = $('.news'); const fresh = app.lang ? newsTicker() : null;
    if (bar) { if (fresh) bar.replaceWith(fresh); else bar.remove(); }
    else if (fresh && app.lang) { const head = $('header.top'); if (head) head.after(fresh); }
    if (app.section === 'home' && !$('#veil') && app.lang) renderHome();
  } catch (e) { /* keep built-in content */ }
}

// ---------- form filled in from a link (the Telegram bot reads an ID photo) ----------
// The data rides in the #fragment, so it never reaches the server; the hash is
// removed right away. Pick fields arrive as text and are matched to the lists.
function readFill() {
  const m = location.hash.match(/^#fill=([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { /* ignore */ }
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === 'object' ? data : null;
  } catch (e) { return null; }
}
const normAr = (s) => latinDigits(String(s || '')).replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه')
  .replace(/[یى]/g, 'ي').replace(/ک/g, 'ك').replace(/^(دائره|مديريه)?\s*(احوال|الاحوال المدنيه في|الاحوال المدنيه)\s*/, '')
  .replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();
function matchPick(key, text) {
  const rows = listFor(key);
  const raw = String(text).trim();
  const byCode = rows.find((r) => r[0] === raw);
  if (byCode) return byCode[0];
  const want = normAr(raw);
  if (!want) return '';
  const exact = rows.find((r) => normAr(r[1]) === want);
  if (exact) return exact[0];
  const near = rows.filter((r) => { const l = normAr(r[1]); return l && (l.includes(want) || want.includes(l)); })
    .sort((a, b) => Math.abs(normAr(a[1]).length - want.length) - Math.abs(normAr(b[1]).length - want.length));
  return near.length ? near[0][0] : '';
}
function fillValues(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    const f = FIELDS[k];
    if (!f || v == null || v === '') continue;
    if (f.type === 'pick') { const code = matchPick(k, v); if (code) out[k] = code; }
    else if (f.type === 'date') { const d = latinDigits(String(v)).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (d) out[k] = `${d[1]}-${d[2].padStart(2, '0')}-${d[3].padStart(2, '0')}`; }
    else if (f.type === 'num') { const n = latinDigits(String(v)).replace(/\D/g, ''); if (n) out[k] = n; }
    else out[k] = clean(v).trim();
  }
  return out;
}
function applyFill(data) {
  const values = fillValues(data);
  const n = Object.keys(values).length;
  if (!n) return false;
  const cur = currentForm();
  if (cur && !Object.keys(cur.values || {}).length) { cur.values = values; useForm(cur); } else addForm(values);
  persist();
  app.view = 'nid'; persistView(); app.review = false;
  goSection('forms');
  count('fill_link', { n });
  toast(t().fillDone(n), 5000);
  return true;
}

function start() {
  const fill = readFill();
  try { app.view = localStorage.getItem('bitaqa.view') === 'consular' ? 'consular' : 'nid'; } catch (e) { /* ignore */ }
  try { const sec = localStorage.getItem(SECTION_KEY); if (['home', 'forms', 'guide', 'services'].includes(sec)) app.section = sec; } catch (e) { /* ignore */ }
  let saved = restore();
  // The first history entry is always the home screen, so back never leaves the app early.
  try {
    history.replaceState({ nav: 1, section: 'home', view: app.view }, '');
    if (app.section !== 'home') history.pushState(navState(), '');
  } catch (e) { /* ignore */ }
  if (fill && !(saved && saved.lang)) saved = { ...(saved || {}), lang: 'Ara' };
  if (saved && saved.lang) {
    app.lang = saved.lang;
    document.documentElement.lang = app.lang === 'Ara' ? 'ar' : 'ckb';
    loadSaved(saved);
    if (fill && applyFill(fill)) return;
    renderCurrent();
    if (hasData(saved) && app.section === 'forms' && app.view === 'nid') askResume();
  } else {
    welcome(saved);
  }
}
start();
// Links from the web pages, shared links and the poster: ?g=<guide> ?qa=<answer|ask> ?src=<where from>
(function openFromLink() {
  let q;
  try { q = new URLSearchParams(location.search); } catch (e) { return; }
  const src = (q.get('src') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 20);
  if (src) count('visit_src', { src });
  const g = q.get('g'); const qa = q.get('qa');
  if (g || qa || src) { try { history.replaceState(history.state, '', location.pathname); } catch (e) { /* ignore */ } }
  if (!app.lang || (!g && !qa)) return;
  setTimeout(() => {
    if (g === 'pension') openPension();
    else if (g === 'natur') openNatur();
    else if (g === 'tvisa') openTvisa();
    else if (g && findGuide(g)) openGuide(g);
    else if (qa) openQA(qa === 'ask', qa === 'ask' ? null : qa.replace(/[^A-Za-z0-9_-]/g, ''));
  }, 400);
}());
loadContent();
loadImpact();
if (app.lang) tally('p', 'p');
window.addEventListener('hashchange', () => { const f = readFill(); if (f && app.lang) applyFill(f); });

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  // A new version took over: reload once so the person sees it straight away
  // (not while they are typing into a sheet or dialog).
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    if ($('#veil') || (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) {
      toast(t() ? (app.lang === 'Kur' ? 'وەشانی نوێ ئامادەیە، لاپەڕەکە نوێ بکەرەوە' : 'يوجد تحديث جديد، أعد فتح البرنامج') : '', 6000);
      return;
    }
    location.reload();
  });
}
