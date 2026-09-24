// QR payload in the official layout: fields 1..42 in order, comma separated,
// followed by the form version tag "1508.1".
import qrcode from './vendor/qrcode.mjs';

// Arabic/Kurdish text must be encoded as UTF-8 bytes.
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

export function qrText(record) {
  const slot = [];
  for (const [key, value] of Object.entries(record)) {
    const n = Number.parseInt(key.slice(1, 3), 10);
    if (n >= 1 && n <= 42) slot[n] = value;
  }
  const parts = [];
  for (let n = 1; n <= 42; n++) {
    const v = slot[n];
    parts.push(v === undefined || v === null ? '' : String(v).replace(/,/g, '\u060C'));
  }
  return parts.join(',') + ',1508.1,';
}

export function qrMatrix(text) {
  const q = qrcode(0, 'H');
  q.addData(text, 'Byte');
  q.make();
  const size = q.getModuleCount();
  return { size, isDark: (r, c) => q.isDark(r, c) };
}
