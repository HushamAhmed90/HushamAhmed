// Admin page for Husham: create case files, move stages, add document photos.
// Case contents are encrypted here before upload; the per-case key is stored on
// the server only wrapped with a key derived from the admin password.
import {
  randomB64, sha256Hex, importKey, sealJSON, openJSON, sealBytes, openBytes, deriveWrapKey,
  caseLink, caseCode, KINDS, h, stepsList, statusPill, isDone, todayISO, shrinkImage, viewer,
} from './track-core.js';

const $app = document.getElementById('app');
const SESSION = 'bitaqa.admin.session';
let wrapKey = null;
let cases = [];          // [{ id, k, s, key, data, files, updated, doneAt, consent }]

// ---------- non-extractable wrap key kept in IndexedDB ----------
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open('bitaqa-admin', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('k');
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
async function idbGet(name) {
  const db = await idb();
  return new Promise((res) => { const t = db.transaction('k').objectStore('k').get(name); t.onsuccess = () => res(t.result || null); t.onerror = () => res(null); });
}
async function idbSet(name, val) {
  const db = await idb();
  return new Promise((res) => { const t = db.transaction('k', 'readwrite'); t.objectStore('k').put(val, name); t.oncomplete = res; t.onerror = res; });
}

const session = () => { try { return localStorage.getItem(SESSION) || ''; } catch (e) { return ''; } };
function toast(msg) {
  const t = h('div', { class: 'toast', text: msg }); document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
async function api(path, { method = 'GET', json, body, raw } = {}) {
  const headers = { Authorization: `Bearer ${session()}` };
  if (json) headers['Content-Type'] = 'application/json';
  if (body) headers['Content-Type'] = 'application/octet-stream';
  const res = await fetch(`/api/track?${path}`, { method, headers, cache: 'no-store', body: json ? JSON.stringify(json) : body });
  if (res.status === 401) { signOut(true); throw new Error('auth'); }
  if (!res.ok) { const e = new Error(String(res.status)); e.status = res.status; throw e; }
  return raw ? res : res.json();
}
function show(...nodes) { $app.replaceChildren(...nodes); }
const top = (title, sub, extra) => h('header', { class: 'top' }, extra || null, h('small', { text: sub }), h('h1', { text: title }));

// ---------- sign in ----------
async function signIn() {
  let status = { setup: true };
  try { status = await (await fetch('/api/track?a=status', { cache: 'no-store' })).json(); } catch (e) { /* offline */ }
  const first = !status.setup;
  const code = h('input', { class: 'in', dir: 'ltr', autocomplete: 'off', placeholder: 'XXXXX-XXXXX-XXXXX-XXXXX' });
  const pw = h('input', { class: 'in', type: 'password', autocomplete: first ? 'new-password' : 'current-password', dir: 'ltr' });
  const pw2 = h('input', { class: 'in', type: 'password', autocomplete: 'new-password', dir: 'ltr' });
  const err = h('p', { class: 'err' });
  const go = h('button', { class: 'btn pri', type: 'submit', text: first ? 'إنشاء كلمة السر والدخول' : 'دخول' });
  const form = h('form', { class: 'card', onsubmit: async (e) => {
    e.preventDefault(); err.textContent = '';
    if (first && pw.value.length < 8) { err.textContent = 'كلمة السر لازم تكون 8 حروف أو أكثر'; return; }
    if (first && pw.value !== pw2.value) { err.textContent = 'كلمتا السر مو متطابقتين'; return; }
    go.disabled = true;
    try {
      const res = await fetch(`/api/track?a=${first ? 'setup' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.value, password: pw.value }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        err.textContent = { code: 'رمز الإعداد غلط', password: 'كلمة السر غلط', slow: 'محاولات كثيرة، انتظر ساعة وجرّب', done: 'الإعداد صار سابقاً، سجّل دخول' }[out.error] || 'صار خطأ، جرّب مرة ثانية';
        if (out.error === 'done') setTimeout(signIn, 1200);
        return;
      }
      wrapKey = await deriveWrapKey(pw.value, out.wsalt);
      await idbSet('wrap', wrapKey);
      localStorage.setItem(SESSION, out.session);
      home();
    } catch (x) { err.textContent = 'تأكد من الإنترنت وجرّب مرة ثانية'; } finally { go.disabled = false; }
  } },
  h('h2', { text: first ? 'أول مرة: إعداد الدخول' : 'دخول لوحة الإدارة' }),
  first ? [h('label', { class: 'lbl', text: 'رمز الإعداد (يوصلك من Claude)' }), code] : null,
  h('label', { class: 'lbl', text: first ? 'اختار كلمة سر (8 حروف أو أكثر)' : 'كلمة السر' }), pw,
  first ? [h('label', { class: 'lbl', text: 'أعد كتابة كلمة السر' }), pw2] : null,
  err, h('div', { class: 'row' }, go),
  h('p', { class: 'muted', text: first ? '⚠️ لا تنسى كلمة السر: بدونها ما تنفتح الملفات المشفّرة.' : '' }));
  show(top('لوحة الإدارة', 'متابعة المعاملات · هشام فقط 🔐'), h('main', { class: 'wrap' }, form));
}
function signOut(expired) {
  try { localStorage.removeItem(SESSION); } catch (e) { /* ignore */ }
  wrapKey = null; idbSet('wrap', null);
  if (expired) toast('انتهت الجلسة، سجّل دخول من جديد');
  signIn();
}

// ---------- list ----------
async function loadCases() {
  const out = await api('a=list');
  const list = [];
  for (const c of out.cases) {
    try {
      const ks = await openJSON(wrapKey, c.wrapped);
      const key = await importKey(ks.k);
      list.push({ ...c, k: ks.k, s: ks.s, key, data: await openJSON(key, c.data) });
    } catch (e) { list.push({ ...c, broken: true, data: { name: '؟ (ما انفتح)', items: [] } }); }
  }
  cases = list.sort((a, b) => b.updated - a.updated);
}
async function home() {
  show(top('كل المعاملات', 'لوحة الإدارة · هشام فقط 🔐'), h('main', { class: 'wrap' }, h('p', { class: 'muted', text: 'جاري التحميل…' })));
  try { await loadCases(); } catch (e) { if (e.message !== 'auth') show(top('كل المعاملات', 'لوحة الإدارة'), h('main', { class: 'wrap' }, h('div', { class: 'card center' }, 'ما گدرنا نحمّل المعاملات. ', h('button', { class: 'btn pri', type: 'button', text: 'إعادة المحاولة', onclick: home })))); return; }
  const row = (c) => {
    const active = (c.data.items || []).filter((it) => !isDone(it)).length;
    const first = (c.data.items || []).find((it) => !isDone(it)) || (c.data.items || [])[0];
    const sub = first ? `${first.title || ''} · ${first.stages[first.stage]}` : 'بدون بنود';
    return h('div', { class: 'it', onclick: () => edit(c) },
      h('div', {}, h('b', { text: c.data.name || caseCode(c.id) }), h('small', { text: `${caseCode(c.id)} · ${sub}` })),
      c.doneAt ? h('span', { class: 'badge ok', text: '✓ مغلق' }) : h('span', { class: active ? 'badge' : 'badge ok', text: active ? `${active} جارية` : '✓' }));
  };
  show(top('كل المعاملات', 'لوحة الإدارة · هشام فقط 🔐'), h('main', { class: 'wrap' },
    h('button', { class: 'btn pri', type: 'button', text: '＋ ملف زبون جديد', onclick: newCase }),
    h('div', { class: 'card list mt12' }, cases.length ? cases.map(row) : h('p', { class: 'muted', text: 'ماكو معاملات بعد.' })),
    h('button', { class: 'btn ghost', type: 'button', text: 'تسجيل خروج', onclick: () => api('a=logout', { method: 'POST' }).finally(() => signOut()) })));
}

// ---------- new case ----------
function newItem(kind) {
  const k = KINDS[kind];
  return { id: randomB64(6), kind, title: k.title, sub: '', stages: [...k.stages], stage: 0, dates: { 0: todayISO() }, note: '', files: [] };
}
function newCase() {
  const name = h('input', { class: 'in', placeholder: 'مثلاً: أم علي' });
  const phone = h('input', { class: 'in', dir: 'ltr', inputmode: 'tel', placeholder: '49170…' });
  const chosen = [];
  const chips = h('div', { class: 'small-btns' });
  const redraw = () => chips.replaceChildren(...chosen.map((kind, i) => h('button', { class: 'btn ghost', type: 'button', text: `${KINDS[kind].icon} ${KINDS[kind].title} ✕`, onclick: () => { chosen.splice(i, 1); redraw(); } })));
  const err = h('p', { class: 'err' });
  const go = h('button', { class: 'btn pri', type: 'button', text: 'إنشاء الملف', onclick: async () => {
    if (!name.value.trim()) { err.textContent = 'اكتب اسم الزبون'; return; }
    if (!chosen.length) { err.textContent = 'اختار معاملة وحدة على الأقل'; return; }
    go.disabled = true;
    try {
      const k = randomB64(32); const s = randomB64(18); const key = await importKey(k);
      const data = { v: 1, name: name.value.trim(), phone: phone.value.replace(/\D/g, ''), items: chosen.map(newItem) };
      const { id } = await api('a=create', { method: 'POST', json: { secretHash: await sha256Hex(s), wrapped: await sealJSON(wrapKey, { k, s }), data: await sealJSON(key, data) } });
      const c = { id, k, s, key, data, files: [], updated: Math.floor(Date.now() / 1000), doneAt: 0, consent: 0 };
      cases.unshift(c);
      edit(c);
    } catch (e) { err.textContent = 'ما انحفظ، جرّب مرة ثانية'; go.disabled = false; }
  } });
  show(top('ملف زبون جديد', 'لوحة الإدارة', h('button', { class: 'back', type: 'button', text: '→ رجوع', onclick: home })), h('main', { class: 'wrap' },
    h('div', { class: 'card' },
      h('label', { class: 'lbl', text: 'اسم الزبون (يطلع له بالصفحة)' }), name,
      h('label', { class: 'lbl', text: 'رقم واتساب الزبون (اختياري، مع رمز الدولة)' }), phone,
      h('label', { class: 'lbl', text: 'المعاملات' }),
      h('div', { class: 'kinds' }, Object.entries(KINDS).map(([kind, k]) => h('button', { type: 'button', text: `${k.icon} ${k.title}`, onclick: () => { chosen.push(kind); redraw(); } }))),
      chips, err, h('div', { class: 'row' }, go)),
    h('p', { class: 'muted', text: '🔒 لا تكتب أرقام هويات أو جوازات أو عناوين. الاسم الأول يكفي.' })));
}

// ---------- edit a case ----------
function edit(c) {
  const d = c.data;
  let dirty = false;
  const mark = () => { dirty = true; };
  const save = async (opts = {}) => {
    const out = await api('a=save', { method: 'POST', json: { id: c.id, data: await sealJSON(c.key, d), ...opts } });
    c.updated = out.updated; c.doneAt = out.doneAt; dirty = false;
    return out;
  };
  const link = () => caseLink(c.id, c.s, c.k);
  const waText = () => {
    const lines = [`مرحبا ${d.name} 🌷`, 'تحديث على معاملتك:'];
    (d.items || []).forEach((it) => {
      lines.push(`• ${it.title}: ${isDone(it) ? 'اكتملت ✅' : it.stages[it.stage]}`);
      if (it.note && !isDone(it)) lines.push(`  📌 ${it.note}`);
    });
    lines.push('', 'تگدر تتابع معاملتك وتشوف الأوراق من هنا:', link(), '', 'هشام احمد');
    return lines.join('\n');
  };

  const fileThumb = (it, f, box) => {
    const img = h('div', { class: 'th', text: '🔒' });
    let url = null;
    const node = h('div', { class: 'doc', onclick: (e) => { if (e.target.closest('.x')) return; if (url) viewer(url, f.label); } }, img, h('span', { text: f.label }),
      h('button', { class: 'x', type: 'button', 'aria-label': 'حذف', text: '✕', onclick: async () => {
        if (!confirm(`حذف «${f.label}»؟`)) return;
        try { await api('a=delfile', { method: 'POST', json: { id: c.id, f: f.f } }); it.files = it.files.filter((x) => x !== f); await save(); node.remove(); toast('انحذفت'); } catch (e) { toast('ما انحذفت'); }
      } }));
    api(`a=adminfile&id=${c.id}&f=${f.f}`, { raw: true }).then((r) => r.arrayBuffer()).then((b) => openBytes(c.key, b))
      .then((bytes) => { url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })); img.replaceChildren(h('img', { src: url, alt: '' })); }).catch(() => {});
    box.append(node);
  };

  const itemCard = (it, idx) => {
    const k = KINDS[it.kind] || KINDS.general;
    const title = h('input', { class: 'in', value: it.title, oninput: () => { it.title = title.value; mark(); } });
    const sub = h('input', { class: 'in', value: it.sub || '', placeholder: 'مثلاً: وكالة خاصة · ميسان', oninput: () => { it.sub = sub.value; mark(); } });
    const stage = h('select', { class: 'in' }, it.stages.map((s, i) => { const o = h('option', { value: String(i), text: s }); if (i === it.stage) o.selected = true; return o; }));
    const preview = h('div');
    const drawPreview = () => preview.replaceChildren(h('div', { class: 'hd' }, h('span', { class: 'ic', text: k.icon }), h('div', {}, h('b', { text: it.title }), h('small', { text: it.sub || '' })), statusPill(it)), stepsList(it));
    stage.addEventListener('change', () => {
      const n = Number(stage.value);
      it.dates = it.dates || {};
      for (let i = 0; i <= n; i += 1) if (!it.dates[i]) it.dates[i] = todayISO();
      Object.keys(it.dates).forEach((i) => { if (Number(i) > n) delete it.dates[i]; });
      it.stage = n; mark(); drawPreview();
    });
    const note = h('textarea', { class: 'in', placeholder: 'مثلاً: صورة القيد طلعت، وننتظر قيد 57 هذا الأسبوع', oninput: () => { it.note = note.value; mark(); } });
    note.value = it.note || '';
    const docs = h('div', { class: 'docs' });
    (it.files || []).forEach((f) => fileThumb(it, f, docs));
    const picker = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    const add = h('button', { class: 'doc add', type: 'button', onclick: () => picker.click() }, '＋', h('span', { text: 'صورة' }));
    picker.addEventListener('change', async () => {
      const list = [...picker.files]; picker.value = '';
      for (const file of list) {
        const label = (prompt('اسم الصورة (مثلاً: الوكالة، صورة القيد)', it.files.length ? 'وثيقة' : 'الوكالة') || 'وثيقة').slice(0, 40);
        add.disabled = true; add.lastChild.textContent = 'جاري الرفع…';
        try {
          const bytes = await shrinkImage(file);
          const f = randomB64(12);
          await api(`a=upload&id=${c.id}&f=${f}`, { method: 'POST', body: await sealBytes(c.key, bytes) });
          const entry = { f, label };
          it.files = [...(it.files || []), entry];
          await save();
          fileThumb(it, entry, docs);
          docs.append(add);
        } catch (e) { toast(e.status === 413 ? 'الصورة كبيرة كلش' : 'ما انرفعت الصورة'); }
        add.disabled = false; add.lastChild.textContent = 'صورة';
      }
    });
    docs.append(add);
    drawPreview();
    return h('section', { class: 'card' }, preview,
      h('label', { class: 'lbl', text: 'المرحلة الحالية' }), stage,
      h('label', { class: 'lbl', text: 'ملاحظة للزبون' }), note,
      h('label', { class: 'lbl', text: 'صور الوكالة / الأوراق' }), docs, picker,
      h('details', {}, h('summary', { class: 'lbl', text: 'تعديل العنوان أو حذف البند' }),
        h('label', { class: 'lbl', text: 'العنوان' }), title, h('label', { class: 'lbl', text: 'سطر توضيحي' }), sub,
        h('button', { class: 'btn danger mt8', type: 'button', text: 'حذف هذا البند', onclick: async () => {
          if (!confirm('حذف البند وصوره؟')) return;
          for (const f of it.files || []) { try { await api('a=delfile', { method: 'POST', json: { id: c.id, f: f.f } }); } catch (e) { /* keep going */ } }
          d.items.splice(idx, 1); await save(); edit(c);
        } })));
  };

  const busy = (btn, fn) => async () => { btn.disabled = true; try { await fn(); } catch (e) { if (e.message !== 'auth') toast('ما انحفظ، جرّب مرة ثانية'); } finally { btn.disabled = false; } };
  const saveBtn = h('button', { class: 'btn pri', type: 'button', text: 'حفظ' });
  saveBtn.onclick = busy(saveBtn, async () => { await save(); toast('انحفظ ✓'); });
  const waBtn = h('button', { class: 'btn wa', type: 'button', text: 'حفظ وبلّغ بالواتساب' });
  waBtn.onclick = busy(waBtn, async () => {
    await save();
    window.open(`https://wa.me/${d.phone || ''}?text=${encodeURIComponent(waText())}`, '_blank', 'noopener');
  });
  const copyBtn = h('button', { class: 'btn ghost', type: 'button', text: 'نسخ رابط الزبون', onclick: async () => {
    try { await navigator.clipboard.writeText(link()); toast('انسخ الرابط ✓'); } catch (e) { prompt('انسخ الرابط:', link()); }
  } });
  const closeBtn = h('button', { class: 'btn ghost', type: 'button', text: c.doneAt ? 'إعادة فتح الملف' : 'إغلاق الملف (انتهت المعاملة)' });
  closeBtn.onclick = busy(closeBtn, async () => {
    if (!c.doneAt && !confirm('إغلاق الملف؟ الصفحة والصور تنمسح تلقائياً بعد 60 يوم.')) return;
    await save({ done: !c.doneAt }); toast(c.doneAt ? 'انغلق الملف' : 'انفتح الملف'); edit(c);
  });
  const delBtn = h('button', { class: 'btn danger', type: 'button', text: 'حذف الملف نهائياً' });
  delBtn.onclick = busy(delBtn, async () => {
    if (!confirm(`حذف ملف ${d.name} وكل صوره نهائياً؟`)) return;
    await api('a=delete', { method: 'POST', json: { id: c.id } });
    cases = cases.filter((x) => x !== c); toast('انحذف'); home();
  });
  const addKind = h('div', { class: 'kinds' }, Object.entries(KINDS).map(([kind, k]) => h('button', { type: 'button', text: `＋ ${k.icon} ${k.title}`, onclick: async () => { d.items.push(newItem(kind)); mark(); edit(c); } })));
  const back = h('button', { class: 'back', type: 'button', text: '→ كل المعاملات', onclick: () => { if (dirty && !confirm('أكو تغييرات ما انحفظت. ترجع بدون حفظ؟')) return; home(); } });

  show(top(d.name || caseCode(c.id), `${caseCode(c.id)}${c.consent ? ' · الزبون شاف الصفحة ✓' : ''}${c.doneAt ? ' · مغلق' : ''}`, back), h('main', { class: 'wrap' },
    (d.items || []).map(itemCard),
    h('div', { class: 'row' }, saveBtn, waBtn),
    h('div', { class: 'small-btns' }, copyBtn),
    h('details', { class: 'card' }, h('summary', { class: 'lbl', text: '＋ إضافة معاملة لنفس الزبون' }), addKind),
    h('details', { class: 'card' }, h('summary', { class: 'lbl', text: 'إعدادات الملف' }),
      h('label', { class: 'lbl', text: 'الاسم' }), h('input', { class: 'in', value: d.name, oninput: (e) => { d.name = e.target.value; mark(); } }),
      h('label', { class: 'lbl', text: 'رقم الواتساب' }), h('input', { class: 'in', dir: 'ltr', value: d.phone || '', oninput: (e) => { d.phone = e.target.value.replace(/\D/g, ''); mark(); } }),
      h('div', { class: 'sep' }), closeBtn, h('div', { class: 'gap8' }), delBtn)));
  window.scrollTo(0, 0);
}

// ---------- start ----------
(async () => {
  if (session()) wrapKey = await idbGet('wrap').catch(() => null);
  if (session() && wrapKey) home(); else signIn();
})();
