// «حياتك بألمانيا»: emergency numbers, public holidays by state, German phrases,
// and German letters (instalment request, free SCHUFA copy) drawn on an A4 canvas.

export const EMERGENCY = [
  { num: '112', Ara: 'إسعاف وإطفاء (حالة خطر على الحياة)', Kur: 'فریاگوزاری و ئاگرکوژێنەوە' },
  { num: '110', Ara: 'الشرطة', Kur: 'پۆلیس' },
  { num: '116117', Ara: 'طبيب خفر بالليل والعطل (مو حالة طوارئ)', Kur: 'پزیشکی ئێشکگر لە شەو و پشووەکان' },
  { num: '116016', Ara: 'خط مساعدة للنساء ضد العنف، مجاني وبيه ترجمة عربي', Kur: 'هێڵی یارمەتی ئافرەتان دژی توندوتیژی، خۆڕایی' },
  { num: '08001110111', show: '0800 111 0 111', Ara: 'خط الدعم النفسي، مجاني 24 ساعة', Kur: 'هێڵی پشتگیری دەروونی، خۆڕایی 24 کاتژمێر' },
  { num: '+496923807600', show: '069 23 807 60 0', Ara: 'القنصلية العامة لجمهورية العراق، فرانكفورت', Kur: 'کونسوڵخانەی گشتی عێراق، فرانکفۆرت' },
  { num: '+493081488100', show: '030 81 48 8 100', Ara: 'سفارة جمهورية العراق، برلين', Kur: 'باڵیۆزخانەی عێراق، بەرلین' },
];
export const EMERGENCY_SOURCE = 'https://www.auswaertiges-amt.de/de/service/laender/irak-node/vertretungenirak/203982';

// ---------- public holidays (gesetzliche Feiertage) ----------
export const STATES = {
  BW: ['بادن-فورتمبيرغ', 'Baden-Württemberg'], BY: ['بافاريا', 'Bayern'], BE: ['برلين', 'Berlin'], BB: ['براندنبورغ', 'Brandenburg'],
  HB: ['بريمن', 'Bremen'], HH: ['هامبورغ', 'Hamburg'], HE: ['هيسن', 'Hessen'], MV: ['مكلنبورغ-فوربومرن', 'Mecklenburg-Vorpommern'],
  NI: ['ساكسونيا السفلى', 'Niedersachsen'], NW: ['شمال الراين-وستفاليا', 'Nordrhein-Westfalen'], RP: ['راينلاند-بفالز', 'Rheinland-Pfalz'],
  SL: ['سارلاند', 'Saarland'], SN: ['ساكسونيا', 'Sachsen'], ST: ['ساكسونيا-أنهالت', 'Sachsen-Anhalt'], SH: ['شليسفيغ-هولشتاين', 'Schleswig-Holstein'], TH: ['تورينغن', 'Thüringen'],
};
function easter(y) {   // Gregorian Easter Sunday (Meeus/Jones/Butcher)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}
const plus = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// [German name, Arabic name, Kurdish name, date, states or null for all]
export function holidays(year) {
  const E = easter(year);
  const nov23 = new Date(year, 10, 23);
  const bussTag = plus(nov23, -(((nov23.getDay() + 7 - 3) % 7) || 7));   // Wednesday before 23 Nov
  return [
    ['Neujahr', 'رأس السنة', 'سەری ساڵ', new Date(year, 0, 1), null],
    ['Heilige Drei Könige', 'عيد الغطاس', 'جەژنی سێ پاشا', new Date(year, 0, 6), ['BW', 'BY', 'ST']],
    ['Internationaler Frauentag', 'يوم المرأة العالمي', 'ڕۆژی جیهانیی ئافرەت', new Date(year, 2, 8), ['BE', 'MV']],
    ['Karfreitag', 'الجمعة العظيمة', 'هەینیی گەورە', plus(E, -2), null],
    ['Ostersonntag', 'أحد الفصح', 'یەکشەممەی جەژنی پاک', E, ['BB']],
    ['Ostermontag', 'اثنين الفصح', 'دووشەممەی جەژنی پاک', plus(E, 1), null],
    ['Tag der Arbeit', 'عيد العمال', 'ڕۆژی کرێکاران', new Date(year, 4, 1), null],
    ['Christi Himmelfahrt', 'عيد الصعود', 'جەژنی بەرزبوونەوە', plus(E, 39), null],
    ['Pfingstsonntag', 'أحد العنصرة', 'یەکشەممەی پەنجاوەمین', plus(E, 49), ['BB']],
    ['Pfingstmontag', 'اثنين العنصرة', 'دووشەممەی پەنجاوەمین', plus(E, 50), null],
    ['Fronleichnam', 'عيد جسد المسيح', 'جەژنی جەستەی مەسیح', plus(E, 60), ['BW', 'BY', 'HE', 'NW', 'RP', 'SL']],
    ['Mariä Himmelfahrt', 'عيد انتقال مريم', 'جەژنی مەریەم', new Date(year, 7, 15), ['SL']],
    ['Weltkindertag', 'يوم الطفل العالمي', 'ڕۆژی جیهانیی منداڵ', new Date(year, 8, 20), ['TH']],
    ['Tag der Deutschen Einheit', 'يوم الوحدة الألمانية', 'ڕۆژی یەکگرتنی ئەڵمانیا', new Date(year, 9, 3), null],
    ['Reformationstag', 'يوم الإصلاح الديني', 'ڕۆژی چاکسازیی ئایینی', new Date(year, 9, 31), ['BB', 'HB', 'HH', 'MV', 'NI', 'SN', 'ST', 'SH', 'TH']],
    ['Allerheiligen', 'عيد جميع القديسين', 'جەژنی هەموو پیرۆزەکان', new Date(year, 10, 1), ['BW', 'BY', 'NW', 'RP', 'SL']],
    ['Buß- und Bettag', 'يوم التوبة والصلاة', 'ڕۆژی تۆبە و نوێژ', bussTag, ['SN']],
    ['1. Weihnachtstag', 'عيد الميلاد', 'جەژنی لەدایکبوون', new Date(year, 11, 25), null],
    ['2. Weihnachtstag', 'ثاني أيام الميلاد', 'ڕۆژی دووەمی لەدایکبوون', new Date(year, 11, 26), null],
  ];
}
export function upcomingHolidays(state, from = new Date(), count = 10) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const all = [...holidays(start.getFullYear()), ...holidays(start.getFullYear() + 1)]
    .filter(([, , , d, states]) => d >= start && (!states || states.includes(state)))
    .sort((a, b) => a[3] - b[3]);
  return all.slice(0, count);
}

// ---------- German phrases for offices ----------
export const PHRASES = [
  { cat: 'office', de: 'Guten Tag, ich habe einen Termin um zehn Uhr.', Ara: 'مرحباً، عندي موعد الساعة عشرة.', Kur: 'ڕۆژباش، ژوانم هەیە لە کاتژمێر دە.' },
  { cat: 'office', de: 'Ich möchte einen Termin vereinbaren.', Ara: 'أريد أحجز موعد.', Kur: 'دەمەوێت ژوانێک بگرم.' },
  { cat: 'office', de: 'Können Sie das bitte langsamer sagen?', Ara: 'ممكن تحچي أبطأ رجاءً؟', Kur: 'تکایە دەتوانیت هێواشتر بیڵێیت؟' },
  { cat: 'office', de: 'Ich habe das nicht verstanden. Können Sie es wiederholen?', Ara: 'ما فهمت، ممكن تعيدها؟', Kur: 'تێنەگەیشتم، دەتوانیت دووبارەی بکەیتەوە؟' },
  { cat: 'office', de: 'Ich brauche einen Dolmetscher für Arabisch.', Ara: 'أحتاج مترجم عربي.', Kur: 'پێویستم بە وەرگێڕی عەرەبییە.' },
  { cat: 'office', de: 'Welche Unterlagen brauche ich?', Ara: 'شنو الأوراق اللي أحتاجها؟', Kur: 'چ بەڵگەنامەیەکم پێویستە؟' },
  { cat: 'office', de: 'Können Sie mir das bitte schriftlich geben?', Ara: 'ممكن تنطيني هذا مكتوب؟', Kur: 'دەتوانیت بە نووسراو پێم بدەیت؟' },
  { cat: 'office', de: 'Bis wann muss ich das abgeben?', Ara: 'لحد متى لازم أسلّمه؟', Kur: 'تا کەی دەبێت ڕادەستی بکەم؟' },
  { cat: 'phone', de: 'Hallo, mein Name ist … Ich rufe wegen meines Briefes an.', Ara: 'ألو، اسمي … أتصل بخصوص رسالتي.', Kur: 'سڵاو، ناوم … پەیوەندی دەکەم سەبارەت بە نامەکەم.' },
  { cat: 'phone', de: 'Mein Aktenzeichen ist …', Ara: 'رقم ملفي هو …', Kur: 'ژمارەی دۆسیەکەم …' },
  { cat: 'phone', de: 'Kann ich bitte mit meinem Sachbearbeiter sprechen?', Ara: 'ممكن أحچي ويّا الموظف المسؤول عن ملفي؟', Kur: 'دەتوانم قسە لەگەڵ فەرمانبەری دۆسیەکەم بکەم؟' },
  { cat: 'doctor', de: 'Ich habe Schmerzen hier.', Ara: 'عندي ألم هنا.', Kur: 'ئێرەم ئازاری هەیە.' },
  { cat: 'doctor', de: 'Ich brauche eine Krankmeldung.', Ara: 'أحتاج إجازة مرضية.', Kur: 'پێویستم بە مۆڵەتی نەخۆشییە.' },
  { cat: 'doctor', de: 'Ich bin allergisch gegen …', Ara: 'عندي حساسية من …', Kur: 'هەستیارییم هەیە بە …' },
  { cat: 'doctor', de: 'Ist das ein Notfall?', Ara: 'هاي حالة طارئة؟', Kur: 'ئەمە حاڵەتی فریاکەوتنە؟' },
];

// ---------- German letters ----------
const W = 794, H = 1123;
const L = 95, R = W - 80;
export const SCHUFA_ADDR = ['SCHUFA Holding AG', 'Privatkunden ServiceCenter', 'Postfach 10 34 41', '50474 Köln'];
const de = (d) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
const isoDe = (s) => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}.${m[2]}.${m[1]}` : String(s || ''); };
const money = (s) => { const n = Number(String(s || '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? `${n.toFixed(2).replace('.', ',')} €` : ''; };

function body(kind, v) {
  if (kind === 'schufa') {
    return {
      to: SCHUFA_ADDR,
      subject: 'Antrag auf unentgeltliche Datenkopie nach Art. 15 DSGVO',
      paras: [
        'Sehr geehrte Damen und Herren,',
        'hiermit beantrage ich gemäß Art. 15 der Datenschutz-Grundverordnung (DSGVO) eine unentgeltliche Kopie aller zu meiner Person bei Ihnen gespeicherten Daten, einschließlich der Herkunft der Daten, der Empfänger, an die Daten übermittelt wurden, sowie der zu meiner Person berechneten Wahrscheinlichkeitswerte (Score-Werte).',
        `Zu meiner Identifizierung: ${v.name}, geboren am ${isoDe(v.birth)}${v.birthPlace ? ` in ${v.birthPlace}` : ''}, wohnhaft ${v.street}, ${v.plzCity}.${v.prevAddr ? ` Frühere Anschrift (letzte 5 Jahre): ${v.prevAddr}.` : ''}`,
        'Bitte senden Sie mir die Datenkopie an die oben genannte Anschrift.',
        'Mit freundlichen Grüßen',
      ],
    };
  }
  return {
    to: [v.toName, v.toStreet, v.toPlzCity].filter(Boolean),
    subject: `Bitte um Ratenzahlung${v.ref ? ` – Aktenzeichen/Kundennummer: ${v.ref}` : ''}`,
    paras: [
      'Sehr geehrte Damen und Herren,',
      `ich habe Ihre Forderung${money(v.total) ? ` über ${money(v.total)}` : ''} erhalten. Leider ist es mir aufgrund meiner aktuellen finanziellen Situation nicht möglich, den gesamten Betrag auf einmal zu bezahlen.`,
      `Ich bitte Sie daher höflich um eine Ratenzahlung in Höhe von ${money(v.rate) || '… €'} monatlich${v.start ? `, beginnend ab ${v.start}` : ''}.`,
      'Bitte bestätigen Sie mir die Ratenzahlung schriftlich und teilen Sie mir mit, ob bis dahin auf weitere Mahnungen und Gebühren verzichtet werden kann.',
      'Für Ihr Verständnis bedanke ich mich im Voraus.',
      'Mit freundlichen Grüßen',
    ],
  };
}

export function drawLetter(canvas, kind, v, scale = 2) {
  canvas.width = W * scale; canvas.height = H * scale;
  const g = canvas.getContext('2d');
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#000'; g.textBaseline = 'alphabetic'; g.direction = 'ltr'; g.textAlign = 'left';
  const font = (size, bold) => { g.font = `${bold ? 'bold ' : ''}${size}px Arial, Helvetica, sans-serif`; };
  const line = (text, x, y, size = 13, bold = false) => { font(size, bold); g.fillText(text || '', x, y); };
  const wrap = (text, x, y, width, size = 13, lh = 20) => {
    font(size, false);
    const words = String(text).split(/\s+/); let cur = ''; let yy = y;
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (g.measureText(test).width > width && cur) { g.fillText(cur, x, yy); yy += lh; cur = w; } else cur = test;
    }
    if (cur) { g.fillText(cur, x, yy); yy += lh; }
    return yy;
  };
  const b = body(kind, v);
  // sender (small line above the address window, and full block on the right)
  line([v.name, v.street, v.plzCity].filter(Boolean).join(' · '), L, 150, 9);
  g.beginPath(); g.moveTo(L, 155); g.lineTo(L + 300, 155); g.lineWidth = 0.5; g.stroke();
  b.to.forEach((t, i) => line(t, L, 180 + i * 19, 13));
  const right = [v.name, v.street, v.plzCity, v.phone ? `Tel.: ${v.phone}` : '', v.email || ''].filter(Boolean);
  right.forEach((t, i) => { font(11, i === 0); g.textAlign = 'right'; g.fillText(t, R, 120 + i * 17); g.textAlign = 'left'; });
  font(12, false); g.textAlign = 'right'; g.fillText(`${v.place ? `${v.place}, ` : ''}${de(new Date())}`, R, 320); g.textAlign = 'left';
  let y = 370;
  font(13.5, true);
  y = (() => { const words = b.subject.split(' '); let cur = ''; let yy = y; for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (g.measureText(t).width > R - L && cur) { g.fillText(cur, L, yy); yy += 20; cur = w; } else cur = t; } g.fillText(cur, L, yy); return yy + 36; })();
  b.paras.forEach((p, i) => { y = wrap(p, L, y, R - L, 13, 20) + (i === b.paras.length - 1 ? 0 : 12); });
  y += 56;
  g.beginPath(); g.moveTo(L, y); g.lineTo(L + 230, y); g.lineWidth = 0.8; g.stroke();
  line(v.name || 'Unterschrift', L, y + 18, 12);
  if (kind === 'schufa') line('Anlage: Kopie des Personalausweises / Reisepasses (Vorder- und Rückseite)', L, Math.min(y + 60, H - 50), 11);
  return canvas;
}
export const LETTER_FIELDS = {
  installment: ['name', 'street', 'plzCity', 'phone', 'toName', 'toStreet', 'toPlzCity', 'ref', 'total', 'rate', 'start', 'place'],
  schufa: ['name', 'birth', 'birthPlace', 'street', 'plzCity', 'prevAddr', 'place'],
};
export const LETTER_REQUIRED = { installment: ['name', 'street', 'plzCity', 'toName', 'rate'], schufa: ['name', 'birth', 'street', 'plzCity'] };
