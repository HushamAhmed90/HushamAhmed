// Live counter for the home-screen numbers ("people who used the app", "forms prepared").
// Stores two plain numbers in Upstash Redis (connected from the Vercel dashboard).
// Nothing personal is stored: a device only sends "p" (first visit) or "f" (a form done).
// Abuse guard: each network address may add at most 40 per day; the address is only
// kept as a salted one-way hash that expires after a day.
const crypto = require('crypto');

// Numbers counted by hand before the live counter started (September 2026).
const BASE = { people: 200, forms: 35 };
const KEYS = { p: 'people', f: 'forms' };
const DAILY_LIMIT = 40;

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(commands) {
  const res = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()).map((r) => r.result);
}

async function totals() {
  const [people, forms] = await redis([['GET', 'people'], ['GET', 'forms']]);
  return { people: BASE.people + (Number(people) || 0), forms: BASE.forms + (Number(forms) || 0) };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!URL_ || !TOKEN) { res.statusCode = 503; res.end('{"error":"not configured"}'); return; }
  try {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.end(JSON.stringify(await totals()));
      return;
    }
    if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    const key = KEYS[body && body.k];
    if (!key) { res.statusCode = 400; res.end('{}'); return; }
    const day = new Date().toISOString().slice(0, 10);
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const guard = 'rl:' + crypto.createHash('sha256').update(`${day}|${ip}|bitaqa`).digest('hex').slice(0, 24);
    const [used] = await redis([['INCR', guard], ['EXPIRE', guard, 86400]]);
    if (used <= DAILY_LIMIT) await redis([['INCR', key]]);
    res.setHeader('Cache-Control', 'no-store');
    res.end('{"ok":true}');
  } catch (e) {
    res.statusCode = 500; res.end('{"error":"failed"}');
  }
};
