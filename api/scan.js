// Read an ID photo to fill in the national card form.
//
// The browser sends one shrunken JPEG. It is passed on to the n8n workflow
// "Scan API" together with a one-time code; n8n checks the code here
// (a=verify) before reading the photo with an AI model, so the n8n address
// cannot be used on its own. Nothing about the photo is stored here, and the
// n8n workflow keeps no execution data.
const { r1, rand, sha, ipOf, send, jsonBody, allow, configured } = require('./_lib');

const N8N = 'https://hushamahmed.app.n8n.cloud/webhook/bitaqa-scan';
const MAX_B64 = 3 * 1024 * 1024;   // about 2.2 MB of JPEG

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'not configured' });
  const q = new URL(req.url, 'http://x').searchParams;
  const a = q.get('a');
  try {
    // Called by n8n: is this one-time code real? (deleted on first use)
    if (a === 'verify') {
      const n = q.get('n') || '';
      if (!/^[A-Za-z0-9_-]{20,64}$/.test(n)) return send(res, 200, { ok: false });
      const hit = await r1('DEL', `scan:n:${n}`);
      return send(res, 200, { ok: hit === 1 });
    }
    if (a !== 'read' || req.method !== 'POST') return send(res, 405, { error: 'method' });
    const ip = sha(ipOf(req)).slice(0, 24);
    if (!(await allow(`scan:${ip}`, 12, 3600)) || !(await allow('scan:all', 300, 86400))) return send(res, 429, { error: 'slow' });
    const b = await jsonBody(req);
    const img = String(b.image || '');
    if (img.length < 1000 || img.length > MAX_B64 || !/^[A-Za-z0-9+/]+=*$/.test(img)) return send(res, 400, { error: 'image' });
    const nonce = rand(24);
    await r1('SET', `scan:n:${nonce}`, '1', 'EX', 120);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 55000);
    let out;
    try {
      const r = await fetch(N8N, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nonce, image: img }), signal: ctl.signal });
      out = await r.json().catch(() => ({}));
    } finally { clearTimeout(timer); }
    if (!out || out.ok !== true || typeof out.fields !== 'object') return send(res, 200, { ok: false, error: (out && out.error) || 'unreadable' });
    const fields = {};
    for (const [k, v] of Object.entries(out.fields)) if (/^a\d{2}[A-Za-z0-9]+$/.test(k) && typeof v === 'string') fields[k] = v.slice(0, 80);
    return send(res, 200, { ok: true, doc: String(out.doc || '').slice(0, 40), fields });
  } catch (e) {
    return send(res, 502, { error: 'failed' });
  }
};
