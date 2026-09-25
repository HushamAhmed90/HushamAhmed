// Consular request forms (Frankfurt and Berlin): power of attorney and life
// certificate. Each is drawn on an A4 canvas (794 x 1123 CSS px) following
// the layout of the blank forms the consulates hand out.

export const PAGE_W = 794;
export const PAGE_H = 1123;

export const CONSULATES = ['frankfurt', 'berlin'];
export const FORMS = ['poa', 'life'];

// Purpose wording, based on special powers of attorney issued by the consulate.
// {place} is replaced with the city/province in Iraq, {passport} with a passport number.
export const POA_PURPOSES = {
  records: 'مراجعة مديرية الأحوال المدنية ومديرية الجنسية وكافة دوائر وزارة الصحة وجميع الدوائر الرسمية ذات العلاقة في {place} لإصدار صورة القيد الإلكترونية وصورة القيد الشخصية عربي / إنكليزي والعائلية الإلكترونية وصورة قيد 57 وصورة قيد الولادة الخاصة بي واستلامها وتصديقها من وزارة الخارجية ومراجعة كافة الدوائر المختصة ذات العلاقة، وله الحق بتوكيل الغير نيابة عني، ولأجله وقعت.',
  record: 'مراجعة وزارة الداخلية / مديرية تحقيق الأدلة الجنائية لمتابعة وإصدار شهادة عدم محكومية العائدة لي، ومراجعة دوائر الأحوال المدنية وشؤون الجنسية لإصدار وتجديد شهادة الجنسية أو إصدار صورة قيد إلكترونية أو صورة قيد 1957 وتصديقها من وزارة الخارجية ومن كافة الدوائر ذات العلاقة والتوقيع نيابة عني فيما يخص ذلك، ومراجعة كافة الدوائر الرسمية وشبه الرسمية لمتابعة وإنجاز المعاملة أعلاه ولمراحلها النهائية، ولأجله وقعت.',
  lostTwice: 'تقديم إخبار عن فاقد جواز مرتين، جواز السفر العراقي العائد لي والمرقم {passport} أمام المحاكم العراقية والجهات الإدارية بما في ذلك مديرية شؤون الجوازات، والمثول أمام القضاء العراقي بصفته وكيلاً عني وتنفيذ كل ما يتطلب إدارياً وقضائياً، كما خولته حق استلام الجواز الخاص بي، وله الحق بتوكيل الغير نيابة عني، ولأجله وقعت.',
  damaged: 'تقديم إخبار عن تلف جواز السفر العراقي العائد لي والمرقم {passport} أمام المحاكم العراقية والجهات الإدارية بما في ذلك مديرية شؤون الجوازات، والمثول أمام القضاء العراقي بصفته وكيلاً عني وتنفيذ كل ما يتطلب إدارياً وقضائياً، كما خولته حق استلام الجواز الخاص بي، وله الحق بتوكيل الغير نيابة عني، ولأجله وقعت.',
  education: 'مراجعة وزارة التعليم العالي والبحث العلمي والجامعات التابعة لها ووزارة التربية ومديرياتها ومدارسها {school}، وجميع الوزارات والدوائر والمؤسسات الرسمية وشبه الرسمية لاستخراج الشهادات والوثائق الدراسية والجامعية العائدة لي وتصديقها من كافة الجهات ذات العلاقة بما فيها الملحقيات الثقافية، كما خولته التوقيع نيابة عني وإتمام المعاملات أعلاه ولمراحلها النهائية، ولأجله وقعت.',
  marriage: 'مراجعة مديرية الأحوال المدنية والجنسية لتأشير زواجي من السيدة ({spouse}) {spouseNat} وتغيير الحالة الزوجية من أعزب إلى متزوج ونقل وتوحيد السجل العائلي العائد لي، وإصدار صورة قيد إلكترونية أو صورة قيد 1957 العائدة لي، وله حق استلامها ومراجعة كافة الدوائر الرسمية وشبه الرسمية ووزارة الخارجية والتوقيع نيابة عني، ومتابعة وإنجاز المعاملة أعلاه ولمراحلها النهائية، ولأجله وقعت.',
  birth: 'مراجعة وزارة الصحة / قسم الإحصاء الصحي والحياتي لغرض تسجيل {childRel} {child} {childBirth} في سجلي، ومراجعة مديرية الأحوال المدنية والجنسية لإصدار صورة قيد إلكترونية أو صورة قيد 1957 العائدة لي ول{childRel} {child} {childBirth}، وله حق استلامها ومراجعة كافة الدوائر الرسمية وشبه الرسمية ووزارة الخارجية والتوقيع نيابة عني، ومتابعة وإنجاز المعاملة أعلاه ولمراحلها النهائية، ولأجله وقعت.',
  custom: '',
};

// Documents to bring (from the Berlin forms).
export const REQUIRED = {
  poa: [
    ['نسخ أصلية وملونة من هوية الأحوال المدنية وشهادة الجنسية العراقية', 'بەڵگەنامەی ڕەسەن و کۆپی ڕەنگاوڕەنگ لە پێناسی باری شارستانی و ڕەگەزنامەی عێراقی'],
    ['صور رسمية للموكل عدد 3', 'وێنەی بریکاردار 3 دانە'],
    ['صور رسمية للوكيل عدد 3', 'وێنەی بریکار 3 دانە'],
    ['سند عقار أو قسام شرعي لوكالة العقار', 'بەڵگەنامەی خاوەندارێتی موڵک یاخود دابەشنامەی یاسایی موڵک بۆ کڕین و فرۆشتن'],
    ['سنوية سيارة لوكالة السيارة', 'ساڵانەی ئۆتۆمبێل بۆ بەناوکردن یاخود فرۆشتن'],
  ],
  life: [
    ['صور رسمية عدد 2', 'وێنەی کەسێتی 2 دانە'],
    ['نسخة ملونة من هوية الأحوال المدنية', 'کۆپی ڕەنگاوڕەنگ لە پێناسی باری شارستانی'],
    ['نسخة ملونة من شهادة الجنسية العراقية', 'کۆپی ڕەنگاوڕەنگ لە ڕەگەزنامەی عێراقی'],
    ['نسخة ملونة من بيان الولادة العراقي للطفل', 'کۆپی ڕەنگاوڕەنگ لە بڕوانامەی لەدایکبوونی عێراقی (بۆ منداڵ)'],
  ],
};

// Which inputs each form needs.
export const FIELDS = {
  'frankfurt.poa': ['principal', 'agent', 'purposeType', 'place', 'passportNo', 'school', 'childRel', 'child', 'childBirth', 'spouse', 'spouseNat', 'purpose', 'latinName', 'street', 'plzCity', 'phone'],
  'berlin.poa': ['principal', 'mother', 'agent', 'principalAddress', 'agentAddress', 'idInfo', 'natInfo', 'purposeType', 'place', 'passportNo', 'school', 'childRel', 'child', 'childBirth', 'spouse', 'spouseNat', 'purpose', 'phone'],
  'frankfurt.life': ['principal', 'agent', 'marital', 'month', 'year', 'latinName', 'street', 'plzCity', 'phone'],
  'berlin.life': ['principal', 'birthDate', 'street', 'plzCity', 'idPlaceDate', 'agent', 'phone'],
};

export const MARITAL = ['أعزب', 'متزوج', 'مطلق', 'أرمل'];

const AR = (w, s) => `${w} ${s}px CairoSheet, Tahoma, sans-serif`;
const LAT = (s) => `${s}px 'Times New Roman', Times, serif`;

function setup(canvas, scale) {
  canvas.width = Math.round(PAGE_W * scale);
  canvas.height = Math.round(PAGE_H * scale);
  const g = canvas.getContext('2d');
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, PAGE_W, PAGE_H);
  g.textBaseline = 'middle';
  g.fillStyle = '#000';
  g.strokeStyle = '#000';
  return g;
}

function helpers(g) {
  const say = (text, x, y, { size = 13, weight = 400, align = 'right', latin = false, color = '#000' } = {}) => {
    if (!text) return 0;
    g.font = latin ? LAT(size) : AR(weight, size);
    g.direction = latin ? 'ltr' : 'rtl';
    g.textAlign = align;
    g.fillStyle = color;
    g.fillText(text, x, y);
    return g.measureText(text).width;
  };
  const wrap = (text, max, font) => {
    g.font = font;
    const out = [];
    for (const para of String(text || '').split('\n')) {
      let line = '';
      for (const w of para.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${w}` : w;
        if (!line || g.measureText(next).width <= max) line = next;
        else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out;
  };
  const para = (text, right, top, width, { size = 13, weight = 400, lh = 26 } = {}) => {
    const lines = wrap(text, width, AR(weight, size));
    lines.forEach((l, i) => say(l, right, top + i * lh, { size, weight }));
    return lines.length;
  };
  const line = (x1, y1, x2, y2, w = 1, dash = null) => {
    g.save(); g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
  };
  const rect = (x, y, w, h, lw = 1) => { g.save(); g.lineWidth = lw; g.strokeRect(x + 0.5, y + 0.5, w, h); g.restore(); };
  return { say, wrap, para, line, rect };
}

const addressLine = (v) => [v.street, v.plzCity].filter(Boolean).join('، ');

// ---------- Frankfurt: special power of attorney ----------
function frankfurtPoa(g, v, emblem) {
  const { say, para, line, rect } = helpers(g);
  say('بسم الله الرحمن الرحيم', 397, 56, { size: 13, weight: 600, align: 'center' });
  say('جمهورية العراق', 600, 112, { size: 14, weight: 600, align: 'center' });
  say('وزارة العدل', 600, 144, { size: 14, weight: 600, align: 'center' });
  say('دائرة الكاتب العدل في فرانكفورت', 600, 174, { size: 13, weight: 600, align: 'center' });
  if (emblem) g.drawImage(emblem, 356, 90, 72, 72 * emblem.naturalHeight / emblem.naturalWidth);
  say('العدد العمومي:', 698, 203, { size: 12 });
  say('السجل:', 698, 230, { size: 12 });
  say('التأريخ:      /      /', 698, 256, { size: 12 });
  say('وكالة خاصة', 397, 284, { size: 15, weight: 600, align: 'center' });

  rect(114, 318, 567, 258);
  const body = `اني الموقع ادناه ${v.principal || '................................'} قد وكلت ${v.agent || '................................'} وكالة خاصة لغرض ${v.purpose || ''}`;
  para(body, 670, 344, 545, { size: 13, lh: 25 });

  say('توقيع الموكل:', 714, 594, { size: 13, weight: 600 });
  const w = say('الاسم الثلاثي:', 714, 624, { size: 13, weight: 600 });
  say(v.principal, 714 - w - 10, 624, { size: 13 });

  const lat = [['Name:', v.latinName], ['Strasse:', v.street], ['Plz Stadt:', v.plzCity], ['Tle: Nr', v.phone]];
  lat.forEach(([k, val], i) => {
    const kw = say(k, 120, 652 + i * 24.5, { size: 17, latin: true, align: 'left' });
    say(val, 120 + kw + 8, 652 + i * 24.5, { size: 16, latin: true, align: 'left' });
  });
  line(120, 746, 694, 746, 1, [4, 3]);
  say('أصدق بأن التوقيع المذيل في الوكالة هو توقيع ................................... المعرف أعلاه وقد تلوت عليه', 698, 768, { size: 11.5 });
  say('مندرجاتها، فأعترف بمنطوقها حرفيا ووقعها أمامي في اليوم       /       /        .', 698, 796, { size: 11.5 });
  say('الكاتب العدل:', 702, 854, { size: 13, weight: 600 });
  say('الاسم الثلاثي:', 702, 886, { size: 13, weight: 600 });
  say('التوقيع والختم:', 702, 918, { size: 13, weight: 600 });
  line(118, 933, 714, 933, 2);
  say('الرسم:', 673, 977, { size: 12 });
  say('رقم الوصل وتأريخه:', 673, 1009, { size: 12 });
}

// ---------- Frankfurt: life certificate ----------
function frankfurtLife(g, v) {
  const { say, para } = helpers(g);
  say('شهادة حياة', 397, 60, { size: 16, weight: 600, align: 'center' });
  say('صورة المتقاعد', 156, 92, { size: 11, align: 'center' });
  say('مع الختم', 156, 124, { size: 11, align: 'center' });
  say('جمهوريـة العراق', 576, 124, { size: 17, weight: 600, align: 'center' });
  say('وزارة الخارجية', 576, 156, { size: 15, weight: 600, align: 'center' });
  say('القنصلية العامة لجمهورية العراق/ فرانكفورت', 694, 190, { size: 13.5, weight: 600 });
  say(`التعهد المقدم من قبل المواطن العراقي المقيم خارج العراق لشهر ${v.month || ''}`, 677, 253, { size: 13.5, weight: 600 });
  say(v.year || '', 196, 253, { size: 13.5, weight: 600, align: 'center' });

  const row = (label, value, y) => {
    const w = say(label, 707, y, { size: 13 });
    say(value, 707 - w - 8, y, { size: 13, weight: 600 });
  };
  row('الاسم الثلاثي واللقب:', v.principal, 346);
  row('الاسم الثلاثي للوكيل داخل العراق:', v.agent, 376);
  row('الحالة الاجتماعية: أعزب/ متزوج/ مطلق/ أرمل:', v.marital, 406);
  say('البلد الذي يقيم فيه المواطن خارج العراق وعنوانه الدائم:', 707, 438, { size: 13 });
  para(`ألمانيا، ${addressLine(v)}`, 707, 468, 580, { size: 13, weight: 600, lh: 26 });

  const lat = [['Name:', v.latinName], ['Strasse:', v.street], ['PLZ Stadt :', v.plzCity], ['Tle Nr :', v.phone]];
  lat.forEach(([k, val], i) => {
    const kw = say(k, i === 3 ? 114 : 120, 551 + i * 25, { size: 17, latin: true, align: 'left' });
    say(val, (i === 3 ? 114 : 120) + kw + 8, 551 + i * 25, { size: 16, latin: true, align: 'left' });
  });
  say('أؤيد ان المعلومات أعلاه قد ثبتت أمامي من قبل المواطن السيد/ السيدة', 707, 688, { size: 13 });
  say('وانه', 110, 688, { size: 13, align: 'right' });
  say('على قيد الحياة.', 707, 720, { size: 13 });
  say('أسم وتوقيع المواطن', 630, 804, { size: 13.5, weight: 600, align: 'center' });
  say('أسم وتوقيع القنصل', 280, 804, { size: 13.5, weight: 600, align: 'center' });
  say('ختم القنصلية', 280, 896, { size: 13.5, weight: 600, align: 'center' });
}

// ---------- Berlin: bilingual table forms ----------
function berlinTable(g, { title, kurdish, x0, x1, split, top, rows, docs }) {
  const { say, wrap, rect, line } = helpers(g);
  say(title, 397, top - 42, { size: 15, weight: 600, align: 'center' });
  say(kurdish, 397, top - 16, { size: 14, align: 'center' });
  const labelR = x1 - 8;
  const valueR = split - 8;
  let y = top;
  for (const r of rows) {
    const h = r.h;
    rect(x0, y, x1 - x0, h);
    if (!r.full) line(split + 0.5, y, split + 0.5, y + h);
    say(r.ar, labelR, y + 14, { size: 12.5, weight: 600 });
    const kl = wrap(r.ku, x1 - split - 16, AR(400, 11.5));
    kl.forEach((l, i) => say(l, labelR, y + 34 + i * 18, { size: 11.5 }));
    if (r.full) {
      const lines = wrap(r.value || '', x1 - x0 - 24, AR(400, 12.5));
      lines.forEach((l, i) => say(l, labelR, y + 60 + i * 22, { size: 12.5 }));
    } else if (r.value) {
      const lines = wrap(r.value, split - x0 - 16, AR(600, 12.5));
      const start = y + h / 2 - (lines.length - 1) * 10;
      lines.forEach((l, i) => say(l, valueR, start + i * 20, { size: 12.5, weight: 600 }));
    }
    y += h;
  }
  // required documents
  const dh = docs.h;
  rect(x0, y, x1 - x0, dh);
  line(split + 0.5, y, split + 0.5, y + dh);
  say('المستمسكات المطلوبة:', labelR, y + 30, { size: 12.5, weight: 600 });
  say('بەڵگەنامەی پێویست :', labelR, y + 52, { size: 11.5 });
  let dy = y + 26;
  for (const [ar, ku] of docs.items) {
    const al = wrap(ar, split - x0 - 40, AR(600, 12));
    al.forEach((l, i) => { say(l, valueR - 18, dy + i * 19, { size: 12, weight: 600 }); });
    g.beginPath(); g.arc(valueR - 6, dy, 2.2, 0, Math.PI * 2); g.fill();
    dy += al.length * 19;
    const kl = wrap(ku, split - x0 - 40, AR(400, 11));
    kl.forEach((l, i) => say(l, valueR - 18, dy + i * 17, { size: 11 }));
    dy += kl.length * 17 + 8;
  }
}

function berlinLife(g, v) {
  berlinTable(g, {
    title: 'استمارة شهادة الحياة الاعتيادية', kurdish: 'فۆرمی بەڕژیانی ئاسایی',
    x0: 56, x1: 706, split: 410, top: 100,
    rows: [
      { ar: 'الاسم الثلاثي', ku: 'ناوی سیانی', h: 52, value: v.principal },
      { ar: 'تاريخ الميلاد', ku: 'ڕۆژی لە دایکبوون', h: 44, value: v.birthDate },
      { ar: 'العنوان الدائم في ألمانيا', ku: 'ناونیشانی هەمیشەیی لە ئەڵمانیا', h: 84, value: addressLine(v) },
      { ar: 'مكان وتاريخ اصدار هوية الاحوال المدنية', ku: 'شوێن و بەرواری دەرچوونی پێناسی باری شارستانی', h: 72, value: v.idPlaceDate },
      { ar: 'اسم الوكيل', ku: 'ناوی بریکار', h: 92, value: v.agent },
      { ar: 'رقم الهاتف', ku: 'ژمارەی تەلەفۆن', h: 54, value: v.phone },
      { ar: 'التاريخ والتوقيع', ku: 'بەروار و واژوو', h: 52, value: '' },
    ],
    docs: { h: 300, items: REQUIRED.life },
  });
}

function berlinPoa(g, v) {
  berlinTable(g, {
    title: 'استمارة الوكالة الخاصة والعامة', kurdish: 'فۆرمی بریکارنامەی تایبەت و گشتی',
    x0: 42, x1: 708, split: 380, top: 70,
    rows: [
      { ar: 'الاسم الثلاثي للموكل', ku: 'ناوی سیانی بریکاردار', h: 44, value: v.principal },
      { ar: 'الاسم الثلاثي لوالدة الموكل', ku: 'ناوی سیانی دایکی بریکاردار', h: 44, value: v.mother },
      { ar: 'الاسم الثلاثي للوكيل', ku: 'ناوی سیانی بریکار', h: 44, value: v.agent },
      { ar: 'عنوان الموكل', ku: 'ناونیشانی بریکاردار', h: 44, value: v.principalAddress },
      { ar: 'عنوان الوكيل', ku: 'ناونیشانی بریکار', h: 44, value: v.agentAddress },
      { ar: 'رقم وتاريخ اصدار هوية الاحوال المدنية للموكل', ku: 'ژمارە و بەرواری دەرچوونی پێناسی باری شارستانی بریکاردار', h: 62, value: v.idInfo },
      { ar: 'رقم وتاريخ اصدار شهادة الجنسية للموكل', ku: 'ژمارە و بەرواری دەرچوونی ڕەگەزنامەی عێراقی بریکاردار', h: 62, value: v.natInfo },
      { ar: 'غرض الوكالة', ku: 'مەبەستی بریکارنامە', h: 214, value: v.purpose, full: true },
      { ar: 'رقم الهاتف', ku: 'ژمارەی تەلەفۆن', h: 44, value: v.phone },
      { ar: 'التاريخ والتوقيع', ku: 'بەروار و واژوو', h: 44, value: '' },
    ],
    docs: { h: 300, items: REQUIRED.poa },
  });
}

export async function consularFontsReady() {
  if (!document.fonts) return;
  await Promise.all([document.fonts.load(AR(400, 12), 'ا'), document.fonts.load(AR(600, 12), 'ا')]);
}

export function drawConsular(canvas, { consulate, form, values, emblem, scale = 2 }) {
  const g = setup(canvas, scale);
  const key = `${consulate}.${form}`;
  if (key === 'frankfurt.poa') frankfurtPoa(g, values, emblem);
  else if (key === 'frankfurt.life') frankfurtLife(g, values);
  else if (key === 'berlin.poa') berlinPoa(g, values);
  else berlinLife(g, values);
  return canvas;
}
