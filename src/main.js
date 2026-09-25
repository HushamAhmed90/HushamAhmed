import { LISTS } from './lists.js';
import { FIELDS, FIXED, SECTIONS, LABELS } from './schema.js';
import { UI, OWNER, SERVICES } from './texts.js';
import { drawSheet, sheetFontsReady } from './sheet.js';
import { jpegPagePdf } from './pdf.js';
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
const count = (name, data) => { try { window.va && window.va('event', { name, data: { lang: app.lang || '', ...(data || {}) } }); } catch (e) { /* ignore */ } };
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
      '(مرسل من برنامج استمارة البطاقة الوطنية)',
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
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = h('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
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
    control = h('input', { class: 'input', id, type: 'date', max: new Date().toISOString().slice(0, 10), value: app.values[key] || '' });
    control.addEventListener('change', () => { setValue(key, control.value); });
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
      h('button', { class: 'chip', type: 'button', text: t().otherLang, onclick: () => setLang(app.lang === 'Ara' ? 'Kur' : 'Ara') })),
    h('div', { class: 'owner' },
      h('a', { class: 'owner-who', href: waLink(t().waHello), target: '_blank', rel: 'noopener', onclick: () => count('whatsapp_click', { place: 'header' }) },
        h('img', { src: o.photo, alt: '', width: 30, height: 30 }),
        h('span', { text: `${t().by} ${o.name[app.lang]}` })),
      social('tt', o.tiktok, 'TikTok', 'tiktok_click'),
      social('fb', o.facebook, 'Facebook', 'facebook_click'),
      social('wa', waLink(t().waHello), 'WhatsApp', 'whatsapp_click')));
  return head;
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
    if (key === 'booking' || key === 'lawyer') { e.preventDefault(); openRequest(key === 'lawyer' ? 'lawyer' : null); }
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

// ---------- tabs ----------
function tabs() {
  const u = t();
  const tab = (id, label) => h('button', { class: 'tab' + (app.view === id ? ' on' : ''), type: 'button', 'aria-pressed': String(app.view === id),
    onclick: () => { if (app.view === id) return; app.view = id; persistView(); renderCurrent(); scrollTo(0, 0); } }, label);
  return h('nav', { class: 'tabs', 'aria-label': u.appName }, tab('nid', u.tabNid), tab('consular', u.tabConsular));
}
function persistView() { try { localStorage.setItem('bitaqa.view', app.view); } catch (e) { /* ignore */ } }

// ---------- consular forms ----------
const C_KEY = 'bitaqa.consular.v1';
const cState = (() => {
  try { return JSON.parse(localStorage.getItem(C_KEY) || 'null') || {}; } catch (e) { return {}; }
})();
cState.consulate = cState.consulate || 'frankfurt';
cState.form = cState.form || 'poa';
cState.values = cState.values || {};
if (cState.values.purposeType === 'birthMarriage') cState.values.purposeType = 'birth';
const cSave = () => { try { localStorage.setItem(C_KEY, JSON.stringify(cState)); } catch (e) { /* ignore */ } };

function cPrefill() {
  const v = cState.values;
  const f = app.values || {};
  if (!v.principal) {
    const full = [f.a07name1, f.a06name2, f.a09name3, f.a08name4].filter(Boolean).join(' ');
    if (full) v.principal = full;
  }
  if (!v.mother && f.a11motherName) v.mother = [f.a11motherName, f.a10motherFatherName].filter(Boolean).join(' ');
  if (!v.phone && f.a40phone) v.phone = f.a40phone;
  if (!v.birthDate && f.a05birthDate) v.birthDate = f.a05birthDate;
  if (!v.month) { v.month = UI.Ara.cMonths[new Date().getMonth()]; v.year = String(new Date().getFullYear()); }
  if (!v.purposeType) v.purposeType = 'records';
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
function cValues() {
  const v = { ...cState.values };
  if (cState.consulate === 'berlin' && cState.form === 'poa') {
    if (!v.principalAddress) v.principalAddress = ['ألمانيا', v.street, v.plzCity].filter(Boolean).join('، ');
  }
  return v;
}

function cField(key) {
  const u = t();
  const v = cState.values;
  const label = u.cLabels[key];
  const required = key === 'principal' || key === 'agent';
  const wrap = h('div', { class: 'field', 'data-c': key });
  wrap.append(h('label', { for: 'c_' + key }, label, required ? h('span', { class: 'req', text: ' *' }) : null));
  const bind = (el, after) => el.addEventListener('input', () => { v[key] = el.value; cSave(); wrap.classList.remove('bad'); if (after) after(); });

  if (key === 'purposeType') {
    const chips = h('div', { class: 'chips' }, Object.entries(u.cPurposeTypes).map(([id, name]) =>
      h('button', { class: 'chipbtn' + (v.purposeType === id ? ' on' : ''), type: 'button', text: name, onclick: () => {
        v.purposeType = id; v.purpose = id === 'custom' ? '' : purposeText(); cSave(); renderConsular(true);
      } })));
    wrap.append(chips);
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
  if (key === 'place' && v.purposeType !== 'records') return null;
  if (key === 'passportNo' && !['lostTwice', 'damaged'].includes(v.purposeType)) return null;
  if (key === 'school' && v.purposeType !== 'education') return null;
  if (['childRel', 'child', 'childBirth'].includes(key) && v.purposeType !== 'birth') return null;
  if (['spouse', 'spouseNat'].includes(key) && v.purposeType !== 'marriage') return null;
  if (key === 'childRel') {
    wrap.append(h('div', { class: 'chips' }, ['ابنتي', 'ابني'].map((rel) => h('button', {
      class: 'chipbtn' + ((v.childRel || 'ابنتي') === rel ? ' on' : ''), type: 'button', text: rel,
      onclick: () => { v.childRel = rel; v.purpose = purposeText(); cSave(); renderConsular(true); } }))));
    return wrap;
  }
  const latin = ['latinName', 'street', 'plzCity'].includes(key);
  const type = key === 'birthDate' || key === 'childBirth' ? 'date' : key === 'phone' ? 'tel' : 'text';
  const inp = h('input', { class: 'input', id: 'c_' + key, type, dir: latin || key === 'phone' ? 'ltr' : null, autocomplete: 'off',
    inputmode: key === 'year' ? 'numeric' : null });
  inp.value = v[key] || '';
  if (key === 'passportNo') inp.setAttribute('dir', 'ltr');
  if (key === 'school') inp.setAttribute('placeholder', 'مثلاً: إعدادية الميثاق المسائية / نينوى');
  if (key === 'spouseNat') inp.setAttribute('placeholder', 'مثلاً: بريطانية');
  bind(inp, ['place', 'passportNo', 'school', 'child', 'childBirth', 'spouse', 'spouseNat'].includes(key) && v.purposeType !== 'custom' ? () => {
    v.purpose = purposeText(); cSave();
    const ta = document.getElementById('c_purpose'); if (ta) ta.value = v.purpose;
  } : null);
  wrap.append(inp);
  return wrap;
}

function renderConsular(keepScroll) {
  const u = t();
  const y = scrollY;
  cPrefill();
  const pick = (options, current, onPick) => h('div', { class: 'chips big' }, Object.entries(options).map(([id, name]) =>
    h('button', { class: 'chipbtn' + (current === id ? ' on' : ''), type: 'button', text: name, onclick: () => onPick(id) })));
  const keys = C_FIELDS[`${cState.consulate}.${cState.form}`];
  const docs = C_REQUIRED[cState.form];
  $('#app').replaceChildren(
    header(), promoBanner(), tabs(),
    h('main', { class: 'cards consular' },
      h('p', { class: 'note', text: u.cIntro }),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' },
        h('p', { class: 'qlabel', text: u.cConsulate }),
        pick(u.cPlaces, cState.consulate, (id) => { cState.consulate = id; cSave(); renderConsular(true); }),
        h('p', { class: 'qlabel', text: u.cForm }),
        pick(u.cForms, cState.form, (id) => { cState.form = id; cSave(); renderConsular(true); }))),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' },
        h('p', { class: 'qlabel', text: u.cInfo }), keys.map(cField))),
      h('section', { class: 'card open' }, h('div', { class: 'card-body flat' },
        h('p', { class: 'qlabel', text: u.cRequired }),
        h('ul', { class: 'docs' }, docs.map(([ar, ku]) => h('li', { text: app.lang === 'Kur' ? ku : ar }))),
        h('p', { class: 'hint', text: u.cRequiredNote }))),
      h('p', { class: 'disclaimer', text: u.disclaimer })),
    h('div', { class: 'dock' }, h('button', { class: 'btn primary wide big', type: 'button', text: u.review, onclick: cGoReview })),
  );
  if (keepScroll) scrollTo(0, y);
}

function cGoReview() {
  const miss = ['principal', 'agent'].filter((k) => !(cState.values[k] || '').trim());
  if (miss.length) {
    miss.forEach((k) => { const f = document.querySelector(`[data-c="${k}"]`); if (f) { f.classList.add('bad'); if (!f.querySelector('.err')) f.append(h('p', { class: 'err', text: t().fillThis })); } });
    const first = document.querySelector(`[data-c="${miss[0]}"]`); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  count('consular_form', { consulate: cState.consulate, form: cState.form });
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
  const u = t();
  const preview = h('img', { class: 'paper', alt: u.cReviewTitle });
  const service = cState.form === 'poa' ? 'poa' : 'life';
  const formName = `${u.cForms[cState.form]} - ${u.cPlaces[cState.consulate]}`;
  const fname = (ext) => `${UI.Ara.cForms[cState.form]}-${UI.Ara.cPlaces[cState.consulate]}-${(cState.values.principal || '').trim().replace(/\s+/g, '-')}.${ext}`;
  $('#app').replaceChildren(
    header(),
    h('main', { class: 'review' },
      h('h2', { text: u.cReviewTitle }),
      h('p', { class: 'note', text: `${formName}. ${u.cReviewNote}` }),
      h('button', { class: 'paper-btn', type: 'button', 'aria-label': u.tapZoom, onclick: () => {
        if (!cCanvas) return;
        sheet(h('div', { class: 'zoom' }, h('img', { src: cCanvas.toDataURL('image/png'), alt: '' }),
          h('button', { class: 'btn primary wide', type: 'button', text: u.close, onclick: closeSheet })), { tall: true });
      } }, preview),
      h('p', { class: 'hint center', text: u.tapZoom }),
      h('div', { class: 'owner-card' },
        h('div', { class: 'oc-head' }, h('img', { src: OWNER.photo, alt: '', width: 52, height: 52 }),
          h('div', {}, h('b', { text: OWNER.name[app.lang] }), h('p', { text: u.helpTitle }))),
        h('button', { class: 'btn primary wide', type: 'button', text: u.cSubmit, onclick: () =>
          openRequest(service, `${UI.Ara.cForms[cState.form]} - ${cState.consulate === 'berlin' ? 'سفارة' : 'قنصلية'} ${UI.Ara.cPlaces[cState.consulate]}${cState.form === 'poa' && cState.values.purposeType !== 'custom' ? ' (' + UI.Ara.cPurposeTypes[cState.values.purposeType] + ')' : ''}، الوكيل: ${cState.values.agent || ''}`) }),
        h('p', { class: 'trust small', html: ICON.check }, u.noUpfront))),
    h('div', { class: 'dock grid' },
      h('button', { class: 'btn primary', type: 'button', text: u.saveImg, onclick: (e) => cExport('png', e.currentTarget, fname) }),
      h('button', { class: 'btn primary', type: 'button', text: u.savePdf, onclick: (e) => cExport('pdf', e.currentTarget, fname) }),
      h('button', { class: 'btn ghost', type: 'button', text: u.edit, onclick: () => history.back() }),
      h('button', { class: 'btn ghost', type: 'button', text: u.print, onclick: async () => {
        count('consular_print'); const c = await cPaint(2.5); const img = $('#print-page'); img.src = c.toDataURL('image/png');
        await img.decode().catch(() => {}); window.print(); } })),
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
    const ok = kind === 'png' ? await hand(blob, fname('png'))
      : await hand(jpegPagePdf(new Uint8Array(await blob.arrayBuffer()), big.width, big.height), fname('pdf'));
    if (ok) { toast(t().saved); count('consular_saved', { kind, form: cState.form }); }
  } catch (e) { console.error(e); toast(t().failed); }
  finally { busy = false; btn.textContent = label; btn.disabled = false; }
}

// ---------- screens ----------
function renderForm() {
  const root = $('#app');
  root.replaceChildren(
    header(),
    promoBanner(),
    tabs(),
    h('div', { class: 'progress' },
      h('button', { class: 'fambar', type: 'button', onclick: openFamily },
        h('span', { class: 'fambar-who' }, h('small', { text: t().editing }), h('b', { text: personName(app.values) })),
        h('span', { class: 'fambar-btn' }, `${t().family} (${app.forms.length})`)),
      h('p', { id: 'progress-text' }),
      h('div', { class: 'track' }, h('div', { id: 'progress-bar', class: 'fill' }))),
    h('main', { class: 'cards' }, SECTIONS.map(sectionCard),
      h('div', { class: 'two' },
        h('button', { class: 'btn ghost', type: 'button', text: t().saveContact, onclick: saveContact }),
        h('button', { class: 'btn ghost', type: 'button', text: t().shareApp, onclick: shareApp })),
      h('p', { class: 'disclaimer', text: t().disclaimer })),
    h('div', { class: 'dock' }, h('button', { class: 'btn primary wide big', type: 'button', text: t().review, onclick: goReview })),
  );
  refreshStatus();
}

function goReview() {
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
  count('form_completed');
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
  const u = t();
  const preview = h('img', { class: 'paper', alt: u.reviewTitle });
  const root = $('#app');
  root.replaceChildren(
    header(),
    h('main', { class: 'review' },
      h('h2', { text: u.reviewTitle }),
      h('p', { class: 'note', text: u.reviewNote }),
      h('button', { class: 'paper-btn', type: 'button', 'aria-label': u.tapZoom, onclick: zoom }, preview),
      h('p', { class: 'hint center', text: u.tapZoom }),
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
      h('p', { class: 'disclaimer', text: u.disclaimer })),
    h('div', { class: 'dock grid' },
      h('button', { class: 'btn primary', type: 'button', text: u.saveImg, onclick: (e) => save('png', e.currentTarget) }),
      h('button', { class: 'btn primary', type: 'button', text: u.savePdf, onclick: (e) => save('pdf', e.currentTarget) }),
      h('button', { class: 'btn ghost', type: 'button', text: u.edit, onclick: () => history.back() }),
      h('button', { class: 'btn ghost', type: 'button', text: u.print, onclick: doPrint })),
  );
  scrollTo(0, 0);
  sheetCanvas = await paint(2);
  preview.src = sheetCanvas.toDataURL('image/png');
  $('#print-page').src = preview.src;
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

async function hand(blob, name) {
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
  return true;
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
    if (kind === 'png') ok = await hand(blob, fileName('png'));
    else ok = await hand(jpegPagePdf(new Uint8Array(await blob.arrayBuffer()), big.width, big.height), fileName('pdf'));
    if (ok) { toast(t().saved); count(kind === 'png' ? 'saved_image' : 'saved_pdf'); }
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
  persist();
  renderCurrent();
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
  if (app.view === 'consular') return app.cReview ? renderConsularReview() : renderConsular();
  return app.review ? renderReview() : renderForm();
};
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; if (app.lang) renderCurrent(); });
addEventListener('appinstalled', () => { installEvent = null; count('app_installed'); });

addEventListener('popstate', () => {
  if ($('#veil')) { closeSheet(); return; }
  if (app.cReview) { app.cReview = false; renderConsular(); scrollTo(0, 0); return; }
  if (app.review) { app.review = false; renderForm(); scrollTo(0, 0); }
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

function start() {
  try { app.view = localStorage.getItem('bitaqa.view') === 'consular' ? 'consular' : 'nid'; } catch (e) { /* ignore */ }
  const saved = restore();
  if (saved && saved.lang) {
    app.lang = saved.lang;
    document.documentElement.lang = app.lang === 'Ara' ? 'ar' : 'ckb';
    loadSaved(saved);
    renderCurrent();
    if (hasData(saved) && app.view === 'nid') askResume();
  } else {
    welcome(saved);
  }
}
start();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
