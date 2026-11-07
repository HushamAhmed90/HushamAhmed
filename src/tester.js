// Step-by-step page for joining the Google Play closed test (/tester).
const KEY = 'bitaqa.tester.v1';
const ua = navigator.userAgent || '';
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
// Browsers inside other apps don't share the Google account of Chrome / the Play Store.
const inApp = /FBAN|FBAV|FB_IAB|Instagram|TikTok|musical_ly|Bytedance|BytedanceWebview|Snapchat|Line\/|; wv\)/.test(ua);

const track = (name, data) => { try { window.va('event', { name, data: data || {} }); } catch (e) { /* ignore */ } };
let done = [];
try { done = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { done = []; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) { /* ignore */ } };

const steps = [...document.querySelectorAll('.steps li')];
function paint() {
  const next = [1, 2, 3].find((n) => !done.includes(n)) || 0;
  for (const li of steps) {
    const n = Number(li.dataset.step);
    li.classList.toggle('ok', done.includes(n));
    li.classList.toggle('now', n === next);
  }
  document.getElementById('done').hidden = !done.includes(3);
}
for (const li of steps) {
  const n = Number(li.dataset.step);
  li.querySelector('a.btn').addEventListener('click', () => {
    if (!done.includes(n)) { done.push(n); save(); }
    track('tester_step', { step: n });
    setTimeout(paint, 400);
  });
}

if (inApp && !isIOS) {
  document.getElementById('inapp').hidden = false;
  const a = document.getElementById('openChrome');
  const path = location.host + location.pathname;
  a.href = isAndroid ? `intent://${path}#Intent;scheme=https;package=com.android.chrome;end` : location.href;
  a.addEventListener('click', () => track('tester_open_chrome'));
  track('tester_inapp');
} else {
  document.getElementById('copyLink').hidden = true;
}
document.getElementById('copyLink').addEventListener('click', async (e) => {
  try { await navigator.clipboard.writeText(location.href); e.target.textContent = '✅ انتسخ، الصقه بكروم'; } catch (err) { /* ignore */ }
});
if (isIOS) document.getElementById('ios').hidden = false;

paint();
track('tester_view', { ios: isIOS ? 1 : 0, inapp: inApp ? 1 : 0 });
