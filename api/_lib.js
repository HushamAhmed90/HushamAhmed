// Shared helpers for the push and scan functions (files starting with "_" are not routes).
const crypto = require('crypto');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(commands) {
  const res = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()).map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}
const r1 = async (...cmd) => (await redis([cmd]))[0];

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const rand = (n) => crypto.randomBytes(n).toString('base64url');
const ipOf = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
const now = () => Math.floor(Date.now() / 1000);

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(obj));
}
async function jsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 4 * 1024 * 1024) throw new Error('too big'); chunks.push(c); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}
// Fixed-window limiter; returns false when over the limit.
async function allow(bucket, limit, seconds) {
  const k = `rl:${bucket}:${Math.floor(now() / seconds)}`;
  const [n] = await redis([['INCR', k], ['EXPIRE', k, seconds]]);
  return n <= limit;
}
// The admin session from the case-tracking sign-in (same rules as api/track.js).
async function isAdmin(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer ([A-Za-z0-9_-]{30,})$/);
  if (!m) return false;
  const [sess, raw] = await redis([['GET', `sess:${sha(m[1])}`], ['GET', 'admin:pw']]);
  const rec = JSON.parse(raw || 'null');
  return !!sess && sess === String((rec && rec.gen) || 1);
}

module.exports = { redis, r1, sha, rand, ipOf, now, send, jsonBody, allow, isAdmin, configured: () => !!(URL_ && TOKEN) };
