// Phone notifications (Web Push).
//
//   GET  a=key          public key the browser needs to subscribe
//   POST a=sub          save a subscription  { sub, lang }
//   POST a=unsub        remove it            { endpoint }
//   POST a=remind       appointment reminder { endpoint, at (unix s), date, time, label, lang }
//   POST a=unremind     cancel it            { id }
//   GET  a=cron         every 10 minutes: new consulate notices + due reminders
//   GET  a=stats        (admin) number of subscribers
//   POST a=send         (admin) send a message to everyone { title, body }
//
// Stored: the browser's push address and keys (no name, no phone, no email),
// the chosen language, and for reminders the time and the transaction name.
// The signing keys are created on first use and kept in Redis.
const webpush = require('web-push');
const { redis, r1, sha, rand, ipOf, now, send, jsonBody, allow, isAdmin, configured } = require('./_lib');

const SUBJECT = 'https://husham-ahmed.vercel.app/privacy.html';
const MAX_SUBS = 50000;
const TEXT = {
  Ara: {
    apptTitle: '📅 تذكير بموعدك',
    apptBody: (label, date, time) => `موعدك${label ? ` (${label})` : ''} باجر ${date}${time ? ` الساعة ${time}` : ''}. جهّز أوراقك ✅`,
  },
  Kur: {
    apptTitle: '📅 بیرخستنەوەی ژوان',
    apptBody: (label, date, time) => `ژوانەکەت${label ? ` (${label})` : ''} سبەینێیە ${date}${time ? ` کاتژمێر ${time}` : ''}. بەڵگەنامەکانت ئامادە بکە ✅`,
  },
};

async function keys() {
  let raw = await r1('GET', 'push:vapid');
  if (!raw) {
    const k = webpush.generateVAPIDKeys();
    await r1('SET', 'push:vapid', JSON.stringify(k), 'NX');
    raw = await r1('GET', 'push:vapid');
  }
  return JSON.parse(raw);
}
const validSub = (s) => s && typeof s.endpoint === 'string' && /^https:\/\/[^\s]{10,800}$/.test(s.endpoint)
  && s.keys && typeof s.keys.p256dh === 'string' && typeof s.keys.auth === 'string'
  && s.keys.p256dh.length < 200 && s.keys.auth.length < 100;
const langOf = (l) => (l === 'Kur' ? 'Kur' : 'Ara');
const clip = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

// Send one payload to many subscriptions; forget addresses the push service says are gone.
async function deliver(list, payloadFor) {
  const k = await keys();
  webpush.setVapidDetails(SUBJECT, k.publicKey, k.privateKey);
  let sent = 0; const dead = [];
  for (let i = 0; i < list.length; i += 50) {
    await Promise.all(list.slice(i, i + 50).map(async ({ id, rec }) => {
      try {
        await webpush.sendNotification(rec.sub, JSON.stringify(payloadFor(rec)), { TTL: 86400, urgency: 'normal' });
        sent += 1;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) dead.push(id);
      }
    }));
  }
  if (dead.length) await r1('HDEL', 'push:subs', ...dead);
  return sent;
}
async function allSubs() {
  const flat = (await r1('HGETALL', 'push:subs')) || [];
  const out = [];
  for (let i = 0; i < flat.length; i += 2) {
    try { out.push({ id: flat[i], rec: JSON.parse(flat[i + 1]) }); } catch (e) { /* skip */ }
  }
  return out;
}

// Consulate notices that are showing in the app right now (same rule as the app).
function liveNotices(content) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
  return (content.notices || []).filter((n) => n && n.id && n.from <= today && today <= n.to && (!n.until || Date.now() < Date.parse(n.until)));
}
const firstLine = (s) => clip(String(s || '').split('\n').find((x) => x.trim()) || '', 160);

async function cron(req) {
  if (!(await r1('SET', 'push:cronlock', '1', 'EX', 240, 'NX'))) return { skipped: true };
  const result = { notices: 0, reminders: 0 };
  // 1. New consulate notices
  try {
    const host = req.headers.host || 'husham-ahmed.vercel.app';
    const r = await fetch(`https://${host}/content.json?t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } });
    const content = await r.json();
    const live = liveNotices(content);
    const fresh = [];
    const first = await r1('SET', 'push:init', '1', 'NX');
    for (const n of live) {
      const added = await r1('SADD', 'push:sent', n.id);
      if (added === 1 && !first) fresh.push(n);
    }
    if (fresh.length) {
      const subs = await allSubs();
      for (const n of fresh.slice(0, 3)) {
        result.notices += await deliver(subs, (rec) => {
          const L = langOf(rec.lang);
          return { title: `📢 ${clip((n.title && (n.title[L] || n.title.Ara)) || '', 80)}`, body: firstLine(n.text && (n.text[L] || n.text.Ara)), url: '/', tag: `notice-${n.id}` };
        });
      }
    }
  } catch (e) { result.noticeError = true; }
  // 2. Appointment reminders that are due
  const due = (await r1('ZRANGEBYSCORE', 'push:rem', 0, now(), 'LIMIT', 0, 200)) || [];
  if (due.length) {
    await r1('ZREM', 'push:rem', ...due);
    for (const raw of due) {
      let rem; try { rem = JSON.parse(raw); } catch (e) { continue; }
      const recRaw = await r1('HGET', 'push:subs', rem.k);
      if (!recRaw) continue;
      const rec = JSON.parse(recRaw); const L = langOf(rem.lang);
      result.reminders += await deliver([{ id: rem.k, rec }], () => ({
        title: TEXT[L].apptTitle, body: TEXT[L].apptBody(rem.label, rem.date, rem.time), url: '/', tag: `appt-${rem.id}`,
      }));
    }
  }
  return result;
}

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'not configured' });
  const a = new URL(req.url, 'http://x').searchParams.get('a');
  try {
    if (a === 'key') {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return send(res, 200, { key: (await keys()).publicKey });
    }
    if (a === 'cron') return send(res, 200, await cron(req));
    if (a === 'stats') {
      if (!(await isAdmin(req))) return send(res, 401, { error: 'auth' });
      return send(res, 200, { subscribers: await r1('HLEN', 'push:subs'), reminders: await r1('ZCARD', 'push:rem') });
    }
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    const ip = sha(ipOf(req)).slice(0, 24);
    if (!(await allow(`push:${ip}`, 60, 3600))) return send(res, 429, { error: 'slow' });
    const b = await jsonBody(req);

    if (a === 'sub') {
      if (!validSub(b.sub)) return send(res, 400, { error: 'bad' });
      if ((await r1('HLEN', 'push:subs')) > MAX_SUBS) return send(res, 503, { error: 'full' });
      const sub = { endpoint: b.sub.endpoint, keys: { p256dh: b.sub.keys.p256dh, auth: b.sub.keys.auth } };
      await r1('HSET', 'push:subs', sha(sub.endpoint), JSON.stringify({ sub, lang: langOf(b.lang), t: now() }));
      return send(res, 200, { ok: true });
    }
    if (a === 'unsub') {
      if (typeof b.endpoint !== 'string') return send(res, 400, { error: 'bad' });
      await r1('HDEL', 'push:subs', sha(b.endpoint));
      return send(res, 200, { ok: true });
    }
    if (a === 'remind') {
      const at = Number(b.at);
      if (typeof b.endpoint !== 'string' || !Number.isFinite(at) || at < now() - 60 || at > now() + 400 * 86400) return send(res, 400, { error: 'bad' });
      const k = sha(b.endpoint);
      if (!(await r1('HEXISTS', 'push:subs', k))) return send(res, 404, { error: 'nosub' });
      const id = rand(9);
      const rem = { id, k, lang: langOf(b.lang), label: clip(b.label, 60), date: clip(b.date, 16), time: clip(b.time, 8) };
      await r1('ZADD', 'push:rem', Math.floor(at), JSON.stringify(rem));
      return send(res, 200, { ok: true, id });
    }
    if (a === 'unremind') {
      if (typeof b.id !== 'string' || !/^[A-Za-z0-9_-]{8,20}$/.test(b.id)) return send(res, 400, { error: 'bad' });
      const all = (await r1('ZRANGE', 'push:rem', 0, -1)) || [];
      const hit = all.filter((x) => { try { return JSON.parse(x).id === b.id; } catch (e) { return false; } });
      if (hit.length) await r1('ZREM', 'push:rem', ...hit);
      return send(res, 200, { ok: true });
    }
    if (a === 'send') {
      if (!(await isAdmin(req))) return send(res, 401, { error: 'auth' });
      const title = clip(b.title, 80); const body = clip(b.body, 200);
      if (!title) return send(res, 400, { error: 'bad' });
      const sent = await deliver(await allSubs(), () => ({ title, body, url: '/', tag: `msg-${now()}` }));
      return send(res, 200, { ok: true, sent });
    }
    return send(res, 400, { error: 'action' });
  } catch (e) {
    return send(res, 500, { error: 'failed' });
  }
};
