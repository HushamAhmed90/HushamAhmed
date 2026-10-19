// Phone notifications: subscribe/unsubscribe and appointment reminders.
// The server only gets the browser's push address (no name, no phone).

const b64ToBytes = (s) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const post = (a, body) => fetch(`/api/push?a=${a}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
// iPhone: notifications only work once the app is added to the home screen.
export const needsInstall = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  && !(matchMedia('(display-mode: standalone)').matches || navigator.standalone);

async function registration() {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg || navigator.serviceWorker.register('/sw.js');
}
export async function currentSub() {
  if (!pushSupported() || Notification.permission !== 'granted') return null;
  try { return await (await registration()).pushManager.getSubscription(); } catch (e) { return null; }
}
export async function pushOn() { return !!(await currentSub()); }

// Returns 'on', 'denied', 'unsupported' or 'failed'.
export async function enablePush(lang) {
  if (!pushSupported()) return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  try {
    const reg = await registration();
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { key } = await (await fetch('/api/push?a=key')).json();
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
    }
    const res = await post('sub', { sub: sub.toJSON(), lang });
    return res.ok ? 'on' : 'failed';
  } catch (e) { return 'failed'; }
}
export async function disablePush() {
  const sub = await currentSub();
  if (!sub) return;
  try { await post('unsub', { endpoint: sub.endpoint }); } catch (e) { /* ignore */ }
  try { await sub.unsubscribe(); } catch (e) { /* ignore */ }
}
// Language changed: update the stored subscription.
export async function refreshPushLang(lang) {
  const sub = await currentSub();
  if (sub) post('sub', { sub: sub.toJSON(), lang }).catch(() => {});
}

// A reminder the day before an appointment (at 18:00 local time, or an hour from now if that is sooner).
export async function scheduleReminder({ date, time, label, lang }) {
  const sub = await currentSub();
  if (!sub) return null;
  const [y, m, d] = date.split('-').map(Number);
  let at = new Date(y, m - 1, d - 1, 18, 0).getTime();
  const start = new Date(`${date}T${time || '09:00'}`).getTime();
  if (at < Date.now()) at = Math.min(Date.now() + 3600e3, start - 2 * 3600e3);
  if (at < Date.now()) return null;
  const shown = `${d}/${m}`;
  try {
    const res = await post('remind', { endpoint: sub.endpoint, at: Math.floor(at / 1000), date: shown, time, label, lang });
    const out = await res.json();
    return out.ok ? out.id : null;
  } catch (e) { return null; }
}
export async function cancelReminder(id) {
  if (id) post('unremind', { id }).catch(() => {});
}
