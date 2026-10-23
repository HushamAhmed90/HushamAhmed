// "سؤال وجواب": questions people send from the app, answered by the admin.
//
//   GET  a=list        published questions and answers (public)
//   POST a=ask         send a question { q, lang }  (no name, no contact)
//   GET  a=pending     (admin) questions waiting for an answer
//   POST a=save        (admin) publish or edit { id?, from?, q, a, cat }
//   POST a=del         (admin) remove a published answer { id }
//   POST a=drop        (admin) remove a waiting question { id }
//
// Stored: the question text, its language and time. The network address is
// only used, hashed, for the hourly limit.
const { r1, redis, sha, rand, ipOf, now, send, jsonBody, allow, isAdmin, configured } = require('./_lib');

const CATS = ['nid', 'passport', 'poa', 'pension', 'germany', 'travel', 'other'];
const MAX_PENDING = 500;
const clip = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000b-\u001f<>]/g, ' ').trim().slice(0, n);
const catOf = (c) => (CATS.includes(c) ? c : 'other');

// First answers, taken from the app's own guides and consulate notices.
const SEED = [
  { cat: 'nid', q: 'شلون أطلّع البطاقة الوطنية وأنا بألمانيا؟', a: 'تحجز موعد بالقنصلية أو السفارة من موقع الحجز الرسمي لما يعلنون فتح المواعيد، وتعبّي الاستمارة من التطبيق وتطبعها. تجيب ويّاك: هوية الأحوال المدنية وشهادة الجنسية الأصليتين (أو البطاقة الوطنية المنتهية أو التالفة)، ونسخة ملونة من مستمسك الأب أو الأخ أو الأخت، وصورة حديثة بخلفية بيضاء، وتأكيد الموعد مطبوع.' },
  { cat: 'passport', q: 'جوازي منتهي وما عندي بطاقة وطنية، أكدر أجدد الجواز؟', a: 'حسب إعلان قنصلية فرانكفورت، إصدار وتجديد الجواز يحتاج بطاقة وطنية أصلية نافذة ويّا الجواز الأصلي. فطلّع البطاقة الوطنية أول. وإذا محتاج تسافر للعراق قبلها، جواز المرور يمشي لسفرة وحدة (الدليل موجود بالتطبيق).' },
  { cat: 'passport', q: 'الدفع بالقنصلية كاش لو بالكارت؟', a: 'حسب إعلان قنصلية فرانكفورت، الدفع بالبطاقة المصرفية فقط (ماستر كارد أو فيزا كارد)، وما يقبلون الكاش.' },
  { cat: 'other', q: 'أكدر أحجز الموعد عن طريق مكتب أو صفحة بالفيسبوك؟', a: 'القنصلية تطلب الحجز من الشخص نفسه فقط، لأنها كشفت حالات كثيرة لمواعيد مزوّرة عن طريق المكاتب والصفحات. احجز بنفسك من الموقع الرسمي.' },
  { cat: 'pension', q: 'راتبي التقاعدي واكف وما عندي بطاقة موحدة، شسوي؟', a: 'إذا عندك جواز عراقي ساري المفعول، تكدر تسوي وكالة من السفارة أو القنصلية لشخص بالعراق يحدّث بياناتك بهيأة التقاعد حتى يستمر راتبك (حسب تجربة مراجع بسفارة برلين). وإذا عندك بطاقة موحدة، حدّث بنفسك على الموقع الرسمي مجاناً.' },
  { cat: 'nid', q: 'ابني انولد بألمانيا، شلون أسجّله عراقي؟', a: 'تصدّق بيان الولادة الألماني من الخارجية الألمانية وتترجمه للعربي، وتقدّم بالسفارة أو القنصلية حتى تطلع بيان ولادة عراقي. بعدها تسوي وكالة لشخص بالعراق يسجّل الطفل بالأحوال المدنية. التفاصيل بدليل «تسجيل مولود» بالتطبيق.' },
  { cat: 'germany', q: 'أكدر أسوق بإجازة السوق العراقية بألمانيا؟', a: 'أول 6 أشهر من سكنك بألمانيا تكدر تسوق بيها ويّا ترجمة رسمية. بعدها لازم إجازة ألمانية. العراق مو من الدول اللي تتبدل إجازتها بدون امتحان، فتحتاج امتحان نظري وعملي. التفاصيل بدليل «إجازة السوق العراقية» بالتطبيق.' },
];

async function seedOnce() {
  if (!(await r1('SET', 'qa:init', '1', 'NX'))) return;
  const t = now();
  const cmds = SEED.map((s, i) => { const id = rand(6); return ['HSET', 'qa:items', id, JSON.stringify({ id, ...s, t: t - i, u: t - i })]; });
  await redis(cmds);
}
async function all(key) {
  const flat = (await r1('HGETALL', key)) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) { try { out.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip */ } }
  return out.sort((a, b) => (b.u || b.t) - (a.u || a.t));
}

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'not configured' });
  const a = new URL(req.url, 'http://x').searchParams.get('a');
  try {
    if (a === 'list') {
      await seedOnce();
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      const items = (await all('qa:items')).map(({ id, q, a: ans, cat, u }) => ({ id, q, a: ans, cat, u }));
      res.statusCode = 200; res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ items }));
    }
    if (a === 'pending') {
      if (!(await isAdmin(req))) return send(res, 401, { error: 'auth' });
      return send(res, 200, { items: await all('qa:pending') });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    const b = await jsonBody(req);

    if (a === 'ask') {
      const ip = sha(ipOf(req)).slice(0, 24);
      if (!(await allow(`qa:${ip}`, 5, 3600)) || !(await allow('qa:all', 300, 86400))) return send(res, 429, { error: 'slow' });
      const q = clip(b.q, 400);
      if (q.length < 8) return send(res, 400, { error: 'short' });
      if ((await r1('HLEN', 'qa:pending')) >= MAX_PENDING) return send(res, 503, { error: 'full' });
      const id = rand(6);
      await r1('HSET', 'qa:pending', id, JSON.stringify({ id, q, lang: b.lang === 'Kur' ? 'Kur' : 'Ara', t: now() }));
      return send(res, 200, { ok: true });
    }

    if (!(await isAdmin(req))) return send(res, 401, { error: 'auth' });
    if (a === 'save') {
      const q = clip(b.q, 400); const ans = clip(b.a, 2000);
      if (!q || !ans) return send(res, 400, { error: 'bad' });
      const id = typeof b.id === 'string' && /^[A-Za-z0-9_-]{4,20}$/.test(b.id) ? b.id : rand(6);
      const old = JSON.parse((await r1('HGET', 'qa:items', id)) || 'null');
      const item = { id, q, a: ans, cat: catOf(b.cat), t: (old && old.t) || now(), u: now() };
      const cmds = [['HSET', 'qa:items', id, JSON.stringify(item)]];
      if (typeof b.from === 'string') cmds.push(['HDEL', 'qa:pending', b.from]);
      await redis(cmds);
      return send(res, 200, { ok: true, item });
    }
    if (a === 'del' || a === 'drop') {
      if (typeof b.id !== 'string') return send(res, 400, { error: 'bad' });
      await r1('HDEL', a === 'del' ? 'qa:items' : 'qa:pending', b.id);
      return send(res, 200, { ok: true });
    }
    return send(res, 400, { error: 'action' });
  } catch (e) {
    return send(res, 500, { error: 'failed' });
  }
};
