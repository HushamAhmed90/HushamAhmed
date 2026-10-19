// Applies the saved light/dark choice before the page draws (no flash).
(function () {
  var pref = 'auto';
  try { pref = localStorage.getItem('bitaqa.theme') || 'auto'; } catch (e) { /* ignore */ }
  var dark = pref === 'dark' || (pref === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dk', dark);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0B1622' : '#173F5F');
}());
