// Customer page: shows the progress of one case. The link carries #ID.SECRET.KEY;
// only the ID and SECRET go to the server, the KEY stays on this device.
import { OWNER } from './texts.js';
import { importKey, openJSON, openBytes, caseCode, h, stepsList, statusPill, isDone, viewer, KINDS, fmtDate } from './track-core.js';

const MINE = 'bitaqa.mycases';
const $app = document.getElementById('app');
const wa = (text) => `https://wa.me/${OWNER.whatsapp}?text=${encodeURIComponent(text)}`;

function readMine() { try { return JSON.parse(localStorage.getItem(MINE) || '[]'); } catch (e) { return []; } }
function remember(entry) {
  try {
    const list = readMine().filter((x) => x.id !== entry.id);
    list.unshift(entry);
    localStorage.setItem(MINE, JSON.stringify(list.slice(0, 20)));
  } catch (e) { /* private mode */ }
}
function forget(id) { try { localStorage.setItem(MINE, JSON.stringify(readMine().filter((x) => x.id !== id))); } catch (e) { /* ignore */ } }

function top(title, sub, tag) {
  return h('header', { class: 'top' }, h('small', { text: sub }), h('h1', { text: title }), tag ? h('span', { class: 'tag', text: tag }) : null);
}
function show(...nodes) { $app.replaceChildren(...nodes); scrollTo(0, 0); }
function message(title, text, extra) {
  show(top('متابعة معاملتك', `هشام احمد`), h('main', { class: 'wrap' },
    h('div', { class: 'card center' }, h('h2', { text: title }), h('p', { text }), extra || null),
    h('a', { class: 'btn wa', href: wa('مرحبا هشام، أريد أسأل عن معاملتي'), target: '_blank', rel: 'noopener', text: '💬 اسأل هشام على الواتساب' })));
}

function parseHash() {
  const m = location.hash.match(/^#([A-Z2-9]{10})\.([A-Za-z0-9_-]{16,64})\.([A-Za-z0-9_-]{43})$/);
  return m ? { id: m[1], s: m[2], k: m[3] } : null;
}

async function api(path, opts) {
  const res = await fetch(`/api/track?${path}`, { cache: 'no-store', ...opts });
  if (res.status === 404) throw Object.assign(new Error('none'), { code: 404 });
  if (!res.ok) throw new Error(String(res.status));
  return res;
}

function listMine() {
  const mine = readMine();
  if (!mine.length) {
    return message('افتح رابط معاملتك', 'رابط متابعة المعاملة يوصلك من هشام على الواتساب. افتحه من هناك حتى تشوف وين وصلت معاملتك.');
  }
  show(top('معاملاتي', 'متابعة المعاملات · هشام احمد'), h('main', { class: 'wrap' },
    h('div', { class: 'card list' }, mine.map((x) => h('a', { class: 'it', href: `#${x.id}.${x.s}.${x.k}` },
      h('div', {}, h('b', { text: x.name || caseCode(x.id) }), h('small', { text: caseCode(x.id) })), h('span', { class: 'badge', text: 'فتح' })))),
    h('p', { class: 'muted', text: 'هاي المعاملات محفوظة بهذا الموبايل بس.' })));
}

async function load() {
  const p = parseHash();
  if (!p) return listMine();
  show(top('متابعة معاملتك', 'هشام احمد'), h('main', { class: 'wrap' }, h('p', { class: 'muted', text: 'جاري التحميل…' })));
  let key; let info; let data;
  try {
    key = await importKey(p.k);
    info = await (await api(`a=case&id=${p.id}&s=${encodeURIComponent(p.s)}`)).json();
    data = await openJSON(key, info.data);
  } catch (e) {
    if (e.code === 404) { forget(p.id); return message('الرابط ما يشتغل', 'ممكن المعاملة انتهت وانمسحت، أو الرابط ناقص. اسأل هشام يدزلك الرابط من جديد.'); }
    return message('ما گدرنا نفتح المعاملة', 'تأكد من الإنترنت وجرّب مرة ثانية. إذا تكررت، اسأل هشام.',
      h('button', { class: 'btn pri', type: 'button', text: 'إعادة المحاولة', onclick: load }));
  }
  remember({ id: p.id, s: p.s, k: p.k, name: data.name || '' });
  if (!info.consent) return consent(p, () => render(p, key, data, info));
  render(p, key, data, info);
}

function consent(p, next) {
  show(top('متابعة معاملتك', 'هشام احمد', caseCode(p.id)), h('main', { class: 'wrap' },
    h('div', { class: 'card consent' },
      h('h2', { text: 'قبل ما تبدي 🔒' }),
      h('p', { text: 'بهالصفحة تتابع مراحل معاملتك، وتشوف صور الوكالة والأوراق اللي ضافها هشام.' }),
      h('p', { text: 'المعلومات والصور محفوظة مشفّرة، وما يگدر يفتحها غيرك وغير هشام. تنمسح تلقائياً بعد انتهاء المعاملة بـ 60 يوم، وتگدر تطلب مسحها بأي وقت.' }),
      h('p', {}, 'التفاصيل بـ ', h('a', { href: '/privacy.html', target: '_blank', rel: 'noopener', text: 'سياسة الخصوصية' }), '.'),
      h('button', { class: 'btn pri', type: 'button', text: 'أوافق، اعرض معاملتي', onclick: async (e) => {
        e.target.disabled = true;
        try { await api('a=consent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, s: p.s }) }); } catch (err) { /* show anyway */ }
        next();
      } }))));
}

function render(p, key, data, info) {
  const items = data.items || [];
  const fileUrl = (f) => {
    f.url = f.url || api(`a=file&id=${p.id}&s=${encodeURIComponent(p.s)}&f=${f.f}`)
      .then((r) => r.arrayBuffer()).then((b) => openBytes(key, b))
      .then((bytes) => URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' })));
    f.url.catch(() => { f.url = null; });
    return f.url;
  };
  const thumb = (f) => {
    const img = h('div', { class: 'th', text: '🔒' });
    const btn = h('button', { class: 'doc', type: 'button', onclick: async () => {
      btn.disabled = true;
      try { viewer(await fileUrl(f), f.label || 'وثيقة'); } catch (e) { alert('ما گدرنا نفتح الصورة، جرّب مرة ثانية'); } finally { btn.disabled = false; }
    } }, img, h('span', { text: f.label || 'وثيقة' }));
    fileUrl(f).then((url) => img.replaceChildren(h('img', { src: url, alt: '' }))).catch(() => {});
    return btn;
  };
  const card = (it) => {
    const k = KINDS[it.kind] || KINDS.general;
    const done = isDone(it);
    return h('section', { class: 'card' },
      h('div', { class: 'hd' }, h('span', { class: 'ic', text: k.icon }), h('div', {}, h('b', { text: it.title || k.title }), it.sub ? h('small', { text: it.sub }) : null), statusPill(it)),
      done ? null : stepsList(it),
      it.note && !done ? h('div', { class: 'note', text: `📌 ${it.note}` }) : null,
      (it.files || []).length ? h('div', { class: 'docs' }, it.files.map(thumb)) : null);
  };
  const updated = new Date(info.updated * 1000);
  show(
    top(data.name ? `أهلاً ${data.name} 🌷` : 'متابعة معاملتك', 'متابعة معاملتك · هشام احمد', caseCode(p.id)),
    h('main', { class: 'wrap' },
      items.length ? items.map(card) : h('div', { class: 'card center', text: 'بعد ما انضافت تفاصيل للمعاملة.' }),
      h('p', { class: 'muted', text: `آخر تحديث: ${fmtDate(`${updated.getFullYear()}-${updated.getMonth() + 1}-${updated.getDate()}`)}` }),
      h('a', { class: 'btn wa', href: wa(`مرحبا هشام، أسأل عن معاملتي ${caseCode(p.id)}`), target: '_blank', rel: 'noopener', text: '💬 اسأل هشام على الواتساب' }),
      h('p', { class: 'muted', text: info.doneAt
        ? `🔒 المعاملة انتهت. هاي الصفحة والصور تنمسح تلقائياً بعد ${info.keepDays} يوم، فنزّل الصور اللي تحتاجها.`
        : `🔒 صورك مشفّرة، وما يشوفها غيرك وغير هشام. تنمسح تلقائياً بعد ${info.keepDays} يوم من انتهاء المعاملة.` })));
}

window.addEventListener('hashchange', load);
load();
