// Builds plain HTML pages that search engines can read (one per guide, Arabic and
// Kurdish), plus sitemap.xml. Run after changing guides or texts:
//   node scripts/build-seo.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { GUIDES } from '../src/guides.js';
import { UI } from '../src/texts.js';
import { NATUR, NATUR_SOURCES } from '../src/natur.js';

const SITE = 'https://husham-ahmed.vercel.app';
const PLAY = 'https://play.google.com/store/apps/details?id=com.hushamahmed.bitaqa';
const today = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const L = {
  Ara: { lang: 'ar', need: 'الأوراق المطلوبة', steps: 'الخطوات', note: 'ملاحظة', src: 'المصادر', open: 'افتح الدليل بالتطبيق', play: 'نزّل التطبيق من Google Play', more: 'أدلة ثانية', qa: '💬 سؤال وجواب عن المعاملات', other: 'کوردی', app: 'هشام للمعاملات', free: 'تطبيق مجاني',
    disc: 'تطبيق مستقل ومجاني من إعداد هشام احمد، غير تابع لحكومة العراق أو أي سفارة أو قنصلية. تأكد دائماً من الجهة الرسمية قبل مراجعتك.', privacy: 'سياسة الخصوصية', home: 'الصفحة الرئيسية' },
  Kur: { lang: 'ckb', need: 'بەڵگەنامە پێویستەکان', steps: 'هەنگاوەکان', note: 'تێبینی', src: 'سەرچاوەکان', open: 'لە بەرنامەکەدا بیکەرەوە', play: 'لە Google Play دایبەزێنە', more: 'ڕێبەری تر', qa: '💬 پرسیار و وەڵام', other: 'عربي', app: 'هیشام بۆ مامەڵەکان', free: 'بەرنامەی خۆڕایی',
    disc: 'بەرنامەیەکی سەربەخۆ و خۆڕاییە لە ئامادەکردنی هیشام ئەحمەد، سەر بە حکومەتی عێراق یان هیچ باڵیۆزخانەیەک نییە.', privacy: 'سیاسەتی تایبەتمەندی', home: 'سەرەکی' },
};

// Every guide in one shape: sections of lists.
function pages(lang) {
  const out = GUIDES.map((g) => {
    const x = g[lang] || g.Ara;
    return { id: g.id, title: x.title, short: x.short, intro: x.intro, sections: [[L[lang].need, x.need, false], [L[lang].steps, x.steps, true]], note: x.note, sources: (g.source || []).map((u) => [u, u]) };
  });
  const u = UI[lang];
  out.push({ id: 'pension', title: u.pnTitle, short: u.pnShort, intro: `${u.pnIntro} ${u.pnDeadline}`,
    sections: [[u.pnAbroadTitle, u.pnAbroad, false], [u.pnNeedTitle, u.pnNeed, false], [u.pnStepsTitle, u.pnSteps, true]], note: `${u.pnMismatch} ${u.pnWarn}`, sources: [['https://pension-update.mof.gov.iq', 'pension-update.mof.gov.iq']] });
  out.push({ id: 'tvisa', title: u.tvTitle, short: u.tvShort, intro: `${u.tvIntro} ${u.tvFee}`,
    sections: [[u.tvNeedTitle, u.tvNeed, false], [u.tvStepsTitle, u.tvSteps, true]], note: `${u.tvValid} ${u.tvWarn}`, sources: [['https://www.evisa.gov.tr', 'evisa.gov.tr']] });
  const n = NATUR[lang] || NATUR.Ara;
  out.push({ id: 'natur', title: n.title, short: n.short, intro: n.intro, sections: [[n.needTitle, n.need, false], [n.factsTitle, n.facts, false]], note: n.interviewNote, sources: NATUR_SOURCES.map(([name, url]) => [url, name]) });
  return out;
}
const file = (id, lang) => `/g/${id}${lang === 'Kur' ? '-ku' : ''}.html`;

function page(p, lang, all) {
  const t = L[lang]; const other = lang === 'Ara' ? 'Kur' : 'Ara';
  const url = SITE + file(p.id, lang);
  const desc = `${p.short}. ${p.intro}`.slice(0, 300);
  const ld = { '@context': 'https://schema.org', '@type': 'HowTo', name: p.title, description: p.intro, inLanguage: t.lang,
    step: (p.sections.find((s) => s[2]) || [, []])[1].map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s })) };
  return `<!doctype html>
<html lang="${t.lang}" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)} | ${esc(t.app)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ar" href="${SITE + file(p.id, 'Ara')}">
<link rel="alternate" hreflang="ckb" href="${SITE + file(p.id, 'Kur')}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(t.app)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.short)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/img/og/${p.id}.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#173F5F">
<link rel="icon" href="/icons/icon-192.png">
<link rel="stylesheet" href="/seo.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header><a class="brand" href="/"><img src="/icons/icon-192.png" alt="" width="40" height="40"><span><b>${esc(t.app)}</b><small>${esc(t.free)}</small></span></a><a class="lang" href="${file(p.id, other)}">${esc(t.other)}</a></header>
<main>
<h1>${esc(p.title)}</h1>
<p class="lead">${esc(p.intro)}</p>
<a class="cta" href="/?g=${p.id}&amp;src=web">${esc(t.open)}</a>
${p.sections.map(([h, items, ol]) => `<h2>${esc(h)}</h2>\n<${ol ? 'ol' : 'ul'}>${(items || []).map((i) => `<li>${esc(i)}</li>`).join('')}</${ol ? 'ol' : 'ul'}>`).join('\n')}
${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
${p.sources.length ? `<p class="src">${esc(t.src)}: ${p.sources.map(([u, n]) => `<a href="${esc(u)}" rel="noopener nofollow" target="_blank">${esc(n.replace(/^https?:\/\//, '').slice(0, 60))}</a>`).join(' · ')}</p>` : ''}
<div class="ctas"><a class="cta" href="/?g=${p.id}&amp;src=web">${esc(t.open)}</a><a class="cta alt" href="${PLAY}" rel="noopener">${esc(t.play)}</a></div>
<h2>${esc(t.more)}</h2>
<ul class="more">${all.filter((q) => q.id !== p.id).map((q) => `<li><a href="${file(q.id, lang)}">${esc(q.title)}</a></li>`).join('')}<li><a href="/qa">${esc(t.qa)}</a></li></ul>
</main>
<footer><p>${esc(t.disc)}</p><p><a href="/">${esc(t.home)}</a> · <a href="/privacy.html">${esc(t.privacy)}</a></p></footer>
</body>
</html>
`;
}

mkdirSync(new URL('../g/', import.meta.url), { recursive: true });
const urls = [`${SITE}/`, `${SITE}/qa`];
for (const lang of ['Ara', 'Kur']) {
  const all = pages(lang);
  for (const p of all) {
    writeFileSync(new URL(`..${file(p.id, lang)}`, import.meta.url), page(p, lang, all));
    urls.push(SITE + file(p.id, lang));
  }
}
urls.push(`${SITE}/privacy.html`);
writeFileSync(new URL('../sitemap.xml', import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync(new URL('./og-ids.json', import.meta.url), JSON.stringify(pages('Ara').map((p) => ({ id: p.id, title: p.title, short: p.short }))));
console.log(urls.length, 'urls');
