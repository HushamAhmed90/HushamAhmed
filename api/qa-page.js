// Public page /qa (rewritten here in vercel.json): all published questions and
// answers as plain HTML, so search engines can read them.
const { r1, configured } = require('./_lib');

const SITE = 'https://husham-ahmed.vercel.app';
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

module.exports = async (req, res) => {
  let items = [];
  if (configured()) {
    try {
      const flat = (await r1('HGETALL', 'qa:items')) || [];
      for (let i = 0; i < flat.length; i += 2) { try { items.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip */ } }
      items.sort((a, b) => (b.u || b.t) - (a.u || a.t));
    } catch (e) { items = []; }
  }
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: 'ar',
    mainEntity: items.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) };
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>سؤال وجواب عن المعاملات العراقية بألمانيا | هشام للمعاملات</title>
<meta name="description" content="أسئلة العراقيين بألمانيا عن البطاقة الوطنية والجواز والوكالات والتقاعد، وأجوبتها بكلام بسيط. اسأل سؤالك مجاناً.">
<link rel="canonical" href="${SITE}/qa">
<meta property="og:type" content="website">
<meta property="og:site_name" content="هشام للمعاملات">
<meta property="og:title" content="💬 سؤال وجواب عن المعاملات">
<meta property="og:description" content="أسئلة الناس عن البطاقة الوطنية والجواز والوكالات والتقاعد، وأجوبتها.">
<meta property="og:url" content="${SITE}/qa">
<meta property="og:image" content="${SITE}/img/og/qa.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#173F5F">
<link rel="icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/seo.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header><a class="brand" href="/"><img src="/icons/icon-192.png" alt="" width="40" height="40"><span><b>هشام للمعاملات</b><small>تطبيق مجاني</small></span></a></header>
<main>
<h1>💬 سؤال وجواب عن المعاملات</h1>
<p class="lead">الأسئلة اللي توصلنا كل يوم من العراقيين بألمانيا، ويّا أجوبتها. ما لكيت سؤالك؟ اسأله من التطبيق.</p>
<a class="cta" href="/?qa=ask&amp;src=web">اسأل سؤالك بالتطبيق</a>
${items.map((x) => `<section class="qa-item" id="q-${esc(x.id)}"><h2>${esc(x.q)}</h2><p>${esc(x.a)}</p><a class="qa-share" href="/?qa=${esc(x.id)}&amp;src=web">افتح بالتطبيق ←</a></section>`).join('\n')}
<div class="ctas"><a class="cta" href="/?src=web">افتح التطبيق</a><a class="cta alt" href="https://play.google.com/store/apps/details?id=com.hushamahmed.bitaqa" rel="noopener">نزّل التطبيق من Google Play</a></div>
</main>
<footer><p>تطبيق مستقل ومجاني من إعداد هشام احمد، غير تابع لحكومة العراق أو أي سفارة أو قنصلية. تأكد دائماً من الجهة الرسمية قبل مراجعتك.</p><p><a href="/">الصفحة الرئيسية</a> · <a href="/privacy.html">سياسة الخصوصية</a></p></footer>
</body>
</html>
`;
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
  res.end(html);
};
