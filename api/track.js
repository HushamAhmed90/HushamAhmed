// Case tracking for people who gave Husham a power of attorney.
//
// The server is a "blind" store: case details and document photos arrive
// already encrypted in the browser (AES-GCM). The key for a case lives only in
// the customer's link (#fragment, never sent to a server) and, wrapped with a
// key derived from the admin password, in the case record for the admin page.
// Stored here: ciphertext, a hash of the link secret, timestamps.
//
// Storage: Upstash Redis (KV_REST_API_*) for records, Vercel Blob (private) for
// encrypted photos. Finished cases are deleted 60 days after they are closed.
const crypto = require('crypto');

// SHA-256 of the one-time setup code given to Husham (the code itself is not in the repo).
const SETUP_HASH = '4457da94e2e025518e2b97626a5c72a9de517aea652462612504a5eec91cf73f';
const KEEP_DAYS = 60;
const DAY = 86400;
const MAX_FILE = 3 * 1024 * 1024;   // encrypted photo, bytes
const MAX_DATA = 200 * 1024;        // encrypted case JSON, characters
const MAX_FILES = 30;

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

// ---------- file store (private Vercel Blob; a folder when testing locally) ----------
const files = process.env.TRACK_FS_BLOB ? (() => {
  const fs = require('fs'); const path = require('path');
  const dir = process.env.TRACK_FS_BLOB;
  const p = (name) => path.join(dir, name.replace(/\//g, '__'));
  return {
    put: async (name, buf) => fs.writeFileSync(p(name), buf),
    get: async (name) => (fs.existsSync(p(name)) ? fs.readFileSync(p(name)) : null),
    del: async (names) => names.forEach((n) => { try { fs.unlinkSync(p(n)); } catch (e) { /* gone */ } }),
  };
})() : (() => {
  const blob = require('@vercel/blob');
  return {
    put: async (name, buf) => blob.put(name, buf, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/octet-stream' }),
    get: async (name) => {
      const r = await blob.get(name, { access: 'private', useCache: false }).catch(() => null);
      if (!r || r.statusCode !== 200) return null;
      return Buffer.from(await new Response(r.stream).arrayBuffer());
    },
    del: async (names) => { if (names.length) await blob.del(names); },
  };
})();

// ---------- helpers ----------
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const rand = (n) => crypto.randomBytes(n).toString('base64url');
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newId = () => Array.from(crypto.randomBytes(10), (b) => ID_CHARS[b % 32]).join('');
const validId = (id) => typeof id === 'string' && /^[A-Z2-9]{10}$/.test(id);
const validFid = (f) => typeof f === 'string' && /^[A-Za-z0-9_-]{8,32}$/.test(f);
const validHash = (h) => typeof h === 'string' && /^[0-9a-f]{64}$/.test(h);
const ipOf = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'local';
const now = () => Math.floor(Date.now() / 1000);

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > MAX_FILE + 1024) throw new Error('too big'); chunks.push(c); }
  return Buffer.concat(chunks);
}
async function jsonBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  try { return JSON.parse((await rawBody(req)).toString('utf8') || '{}'); } catch (e) { return {}; }
}
// Fixed-window limiter; returns false when over the limit.
async function allow(bucket, limit, seconds) {
  const k = `rl:${bucket}:${Math.floor(now() / seconds)}`;
  const [n] = await redis([['INCR', k], ['EXPIRE', k, seconds]]);
  return n <= limit;
}
function scrypt(pw, salt) { return crypto.scryptSync(String(pw), salt, 64).toString('hex'); }
function same(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function getCase(id) {
  const raw = await r1('GET', `case:${id}`);
  return raw ? JSON.parse(raw) : null;
}
async function putCase(c) { await r1('SET', `case:${c.id}`, JSON.stringify(c)); }
async function removeCase(c) {
  await files.del((c.files || []).map((f) => `t/${c.id}/${f}`));
  await redis([['DEL', `case:${c.id}`], ['SREM', 'cases', c.id]]);
}
const expired = (c) => c.doneAt && c.doneAt + KEEP_DAYS * DAY < now();

async function adminFromReq(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer ([A-Za-z0-9_-]{30,})$/);
  if (!m) return false;
  return !!(await r1('GET', `sess:${sha(m[1])}`));
}
async function newSession() {
  const s = rand(32);
  await r1('SET', `sess:${sha(s)}`, '1', 'EX', 30 * DAY);
  return s;
}

// ---------- handler ----------
module.exports = async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!URL_ || !TOKEN) return send(res, 503, { error: 'storage' });
  const q = new URL(req.url, 'http://x').searchParams;
  const a = q.get('a') || '';
  const ip = ipOf(req);
  try {
    // ----- customer -----
    if (a === 'case' || a === 'file' || a === 'consent') {
      if (!(await allow(`c:${sha(ip)}`, 120, 3600))) return send(res, 429, { error: 'slow' });
      const body = a === 'consent' ? await jsonBody(req) : {};
      const id = q.get('id') || body.id; const s = q.get('s') || body.s;
      if (!validId(id) || typeof s !== 'string' || s.length < 16 || s.length > 64) return send(res, 404, { error: 'none' });
      const c = await getCase(id);
      if (!c || !same(c.secretHash, sha(s)) || expired(c)) return send(res, 404, { error: 'none' });
      if (a === 'case') return send(res, 200, { data: c.data, updated: c.updated, consent: c.consent || 0, doneAt: c.doneAt || 0, keepDays: KEEP_DAYS });
      if (a === 'consent') { if (!c.consent) { c.consent = now(); await putCase(c); } return send(res, 200, { ok: true }); }
      const f = q.get('f');
      if (!validFid(f) || !(c.files || []).includes(f)) return send(res, 404, { error: 'none' });
      const buf = await files.get(`t/${id}/${f}`);
      if (!buf) return send(res, 404, { error: 'none' });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.end(buf);
    }

    // ----- admin sign-in -----
    if (a === 'status') return send(res, 200, { setup: !!(await r1('GET', 'admin:pw')) });
    if (a === 'setup' || a === 'login') {
      if (req.method !== 'POST') return send(res, 405, {});
      if (!(await allow(`login:${sha(ip)}`, 10, 3600)) || !(await allow('login:all', 60, 3600))) return send(res, 429, { error: 'slow' });
      const b = await jsonBody(req);
      const pw = String(b.password || '');
      if (a === 'setup') {
        if (await r1('GET', 'admin:pw')) return send(res, 409, { error: 'done' });
        if (!same(sha(String(b.code || '').trim().toUpperCase()), SETUP_HASH)) return send(res, 403, { error: 'code' });
        if (pw.length < 8) return send(res, 400, { error: 'short' });
        const salt = rand(16);
        const ok = await r1('SET', 'admin:pw', JSON.stringify({ salt, hash: scrypt(pw, salt), wsalt: rand(16) }), 'NX');
        if (!ok) return send(res, 409, { error: 'done' });
      }
      const rec = JSON.parse((await r1('GET', 'admin:pw')) || 'null');
      if (!rec || !same(scrypt(pw, rec.salt), rec.hash)) return send(res, 403, { error: 'password' });
      return send(res, 200, { session: await newSession(), wsalt: rec.wsalt });
    }
    if (a === 'logout') {
      const m = String(req.headers.authorization || '').match(/^Bearer (.+)$/);
      if (m) await r1('DEL', `sess:${sha(m[1])}`);
      return send(res, 200, { ok: true });
    }

    // ----- housekeeping (daily cron; only removes cases closed more than KEEP_DAYS ago) -----
    if (a === 'cleanup') {
      const ids = (await r1('SMEMBERS', 'cases')) || [];
      let n = 0;
      for (const id of ids) {
        const c = await getCase(id);
        if (!c) { await r1('SREM', 'cases', id); continue; }
        if (expired(c)) { await removeCase(c); n += 1; }
      }
      return send(res, 200, { removed: n });
    }

    // ----- admin -----
    if (!(await adminFromReq(req))) return send(res, 401, { error: 'auth' });
    if (a === 'list') {
      const ids = (await r1('SMEMBERS', 'cases')) || [];
      const raws = ids.length ? await redis(ids.map((id) => ['GET', `case:${id}`])) : [];
      const out = [];
      for (const raw of raws) {
        if (!raw) continue;
        const c = JSON.parse(raw);
        if (expired(c)) { await removeCase(c); continue; }
        out.push({ id: c.id, wrapped: c.wrapped, data: c.data, files: c.files || [], updated: c.updated, doneAt: c.doneAt || 0, consent: c.consent || 0 });
      }
      return send(res, 200, { cases: out, keepDays: KEEP_DAYS });
    }
    if (a === 'create') {
      const b = await jsonBody(req);
      if (!validHash(b.secretHash) || typeof b.wrapped !== 'string' || typeof b.data !== 'string' || b.data.length > MAX_DATA) return send(res, 400, { error: 'bad' });
      let id; for (let i = 0; i < 5; i += 1) { id = newId(); if (!(await r1('EXISTS', `case:${id}`))) break; }
      const c = { id, secretHash: b.secretHash, wrapped: b.wrapped, data: b.data, files: [], updated: now(), doneAt: 0, consent: 0 };
      await putCase(c); await r1('SADD', 'cases', id);
      return send(res, 200, { id });
    }
    const b = req.method === 'POST' && a !== 'upload' ? await jsonBody(req) : {};
    const id = q.get('id') || b.id;
    if (!validId(id)) return send(res, 400, { error: 'bad' });
    const c = await getCase(id);
    if (!c) return send(res, 404, { error: 'none' });
    if (a === 'save') {
      if (typeof b.data !== 'string' || b.data.length > MAX_DATA) return send(res, 400, { error: 'bad' });
      c.data = b.data; c.updated = now();
      if ('done' in b) c.doneAt = b.done ? (c.doneAt || now()) : 0;
      await putCase(c);
      return send(res, 200, { ok: true, updated: c.updated, doneAt: c.doneAt });
    }
    if (a === 'upload') {
      const f = q.get('f');
      if (!validFid(f)) return send(res, 400, { error: 'bad' });
      if ((c.files || []).length >= MAX_FILES) return send(res, 400, { error: 'many' });
      const buf = await rawBody(req);
      if (!buf.length || buf.length > MAX_FILE) return send(res, 413, { error: 'size' });
      await files.put(`t/${id}/${f}`, buf);
      const fresh = await getCase(id);
      fresh.files = [...new Set([...(fresh.files || []), f])];
      await putCase(fresh);
      return send(res, 200, { ok: true });
    }
    if (a === 'delfile') {
      if (!validFid(b.f)) return send(res, 400, { error: 'bad' });
      await files.del([`t/${id}/${b.f}`]);
      c.files = (c.files || []).filter((x) => x !== b.f); await putCase(c);
      return send(res, 200, { ok: true });
    }
    if (a === 'adminfile') {
      const f = q.get('f');
      if (!validFid(f) || !(c.files || []).includes(f)) return send(res, 404, { error: 'none' });
      const buf = await files.get(`t/${id}/${f}`);
      if (!buf) return send(res, 404, { error: 'none' });
      res.statusCode = 200; res.setHeader('Content-Type', 'application/octet-stream'); res.setHeader('Cache-Control', 'private, no-store');
      return res.end(buf);
    }
    if (a === 'delete') { await removeCase(c); return send(res, 200, { ok: true }); }
    return send(res, 400, { error: 'action' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: 'failed' });
  }
};
