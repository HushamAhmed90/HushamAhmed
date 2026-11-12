// Tiny PDF writer: one A4 page showing one JPEG image edge to edge.
const A4 = [595.28, 841.89];

export function jpegPagePdf(jpeg, width, height) {
  const enc = new TextEncoder();
  const chunks = [];
  const xref = [];
  let size = 0;
  const put = (part) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part;
    chunks.push(bytes);
    size += bytes.length;
  };
  const object = (id, head, stream) => {
    xref[id] = size;
    put(`${id} 0 obj\n${head}\n`);
    if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); }
    put('endobj\n');
  };
  const draw = enc.encode(`q ${A4[0]} 0 0 ${A4[1]} 0 0 cm /P Do Q`);

  put('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Count 1 /Kids [3 0 R] >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] /Resources << /XObject << /P 4 0 R >> >> /Contents 5 0 R >>`);
  object(4, `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /BitsPerComponent 8 /ColorSpace /DeviceRGB /Filter /DCTDecode /Length ${jpeg.length} >>`, jpeg);
  object(5, `<< /Length ${draw.length} >>`, draw);

  const start = size;
  let table = 'xref\n0 6\n0000000000 65535 f \n';
  for (let id = 1; id <= 5; id++) table += `${String(xref[id]).padStart(10, '0')} 00000 n \n`;
  put(`${table}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}

// Several A4 pages, one JPEG each: pages = [{ jpeg, width, height }].
export function jpegPagesPdf(pages) {
  const enc = new TextEncoder();
  const chunks = []; const xref = []; let size = 0;
  const put = (part) => { const b = typeof part === 'string' ? enc.encode(part) : part; chunks.push(b); size += b.length; };
  const object = (id, head, stream) => {
    xref[id] = size; put(`${id} 0 obj\n${head}\n`);
    if (stream) { put('stream\n'); put(stream); put('\nendstream\n'); }
    put('endobj\n');
  };
  const n = pages.length;
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  put('%PDF-1.4\n%âãÏÓ\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, `<< /Type /Pages /Count ${n} /Kids [${kids}] >>`);
  pages.forEach((p, i) => {
    const id = 3 + i * 3;
    const draw = enc.encode(`q ${A4[0]} 0 0 ${A4[1]} 0 0 cm /P Do Q`);
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4[0]} ${A4[1]}] /Resources << /XObject << /P ${id + 1} 0 R >> >> /Contents ${id + 2} 0 R >>`);
    object(id + 1, `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /BitsPerComponent 8 /ColorSpace /DeviceRGB /Filter /DCTDecode /Length ${p.jpeg.length} >>`, p.jpeg);
    object(id + 2, `<< /Length ${draw.length} >>`, draw);
  });
  const total = 3 + n * 3;
  const start = size;
  let table = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let id = 1; id < total; id++) table += `${String(xref[id]).padStart(10, '0')} 00000 n \n`;
  put(`${table}trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
  return new Blob(chunks, { type: 'application/pdf' });
}
