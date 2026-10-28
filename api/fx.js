// Exchange rates for the currency converter: EUR→USD from the European Central Bank
// (reference rate, working days), cached at the edge for 6 hours.
const ECB = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
    const xml = await (await fetch(ECB, { signal: ctl.signal })).text();
    clearTimeout(timer);
    const usd = Number((xml.match(/currency='USD'\s+rate='([\d.]+)'/) || [])[1]);
    const date = (xml.match(/time='(\d{4}-\d{2}-\d{2})'/) || [])[1] || '';
    if (!(usd > 0.5 && usd < 2)) throw new Error('bad');
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    res.end(JSON.stringify({ eurUsd: usd, date, source: 'ECB' }));
  } catch (e) {
    res.statusCode = 502; res.setHeader('Cache-Control', 'no-store');
    res.end('{"error":"unavailable"}');
  }
};
