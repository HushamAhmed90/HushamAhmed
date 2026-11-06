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

export const CONTRACTS = {
  mobile: ['Mobilfunkvertrag', 'الموبايل', 'مۆبایل'],
  internet: ['Internet- und Festnetzvertrag', 'الإنترنت والتلفون الأرضي', 'ئینتەرنێت و تەلەفۆنی ماڵ'],
  gym: ['Mitgliedschaft im Fitnessstudio', 'النادي الرياضي', 'هۆڵی وەرزش'],
  power: ['Stromliefervertrag', 'الكهرباء', 'کارەبا'],
  gas: ['Gasliefervertrag', 'الغاز', 'گاز'],
  insurance: ['Versicherungsvertrag', 'التأمين', 'بیمە'],
  tv: ['Pay-TV- bzw. Streaming-Abonnement', 'التلفزيون أو البث المدفوع', 'تەلەفیزیۆن یان ستریمینگ'],
  magazine: ['Zeitungs- bzw. Zeitschriftenabonnement', 'اشتراك جريدة أو مجلة', 'ئابوونەی ڕۆژنامە'],
  other: ['Vertrag', 'عقد ثاني', 'گرێبەستی تر'],
};

function body(kind, v) {
  if (kind === 'cancel') {
    const c = (CONTRACTS[v.ctype] || CONTRACTS.other)[0];
    const when = v.endDate ? `zum ${isoDe(v.endDate)}, hilfsweise zum nächstmöglichen Zeitpunkt` : 'fristgerecht zum nächstmöglichen Zeitpunkt';
    return {
      to: [v.toName, v.toStreet, v.toPlzCity].filter(Boolean),
      subject: `Kündigung: ${c}${v.ref ? ` – Kunden-/Vertragsnummer: ${v.ref}` : ''}`,
      paras: [
        'Sehr geehrte Damen und Herren,',
        `hiermit kündige ich meinen ${c}${v.ref ? ` (Kunden-/Vertragsnummer ${v.ref})` : ''} ${when}.`,
        'Bitte bestätigen Sie mir den Eingang dieser Kündigung sowie das genaue Vertragsende schriftlich.',
        'Eine erteilte Einzugsermächtigung bzw. ein SEPA-Lastschriftmandat widerrufe ich zum Vertragsende. Einer Nutzung meiner Daten zu Werbezwecken sowie einer telefonischen Kontaktaufnahme zur Rückgewinnung widerspreche ich.',
        'Mit freundlichen Grüßen',
      ],
    };
  }
  if (kind === 'objection') {
    return {
      to: [v.toName, v.toStreet, v.toPlzCity].filter(Boolean),
      subject: `Widerspruch gegen den Bescheid vom ${isoDe(v.decDate)}${v.ref ? ` – Aktenzeichen/Kundennummer: ${v.ref}` : ''}`,
      paras: [
        'Sehr geehrte Damen und Herren,',
        `hiermit lege ich gegen Ihren Bescheid vom ${isoDe(v.decDate)}${v.ref ? ` (Aktenzeichen/Kundennummer ${v.ref})` : ''}${v.birth ? `, betreffend ${v.name}, geboren am ${isoDe(v.birth)},` : ''} fristgerecht Widerspruch ein.`,
        v.reason ? `Begründung: ${v.reason}` : 'Die Begründung reiche ich gesondert nach. Zu diesem Zweck bitte ich um Einsicht in meine Akte bzw. um Übersendung der für die Entscheidung maßgeblichen Unterlagen.',
        'Bitte bestätigen Sie mir den Eingang dieses Widerspruchs schriftlich.',
        'Mit freundlichen Grüßen',
      ],
    };
  }
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
  cancel: ['name', 'street', 'plzCity', 'phone', 'ctype', 'toName', 'toStreet', 'toPlzCity', 'ref', 'endDate', 'place'],
  objection: ['name', 'birth', 'street', 'plzCity', 'phone', 'toName', 'toStreet', 'toPlzCity', 'ref', 'decDate', 'reason', 'place'],
  schufa: ['name', 'birth', 'birthPlace', 'street', 'plzCity', 'prevAddr', 'place'],
};
export const LETTER_REQUIRED = { installment: ['name', 'street', 'plzCity', 'toName', 'rate'], schufa: ['name', 'birth', 'street', 'plzCity'],
  cancel: ['name', 'street', 'plzCity', 'ctype', 'toName', 'toStreet', 'toPlzCity'], objection: ['name', 'street', 'plzCity', 'toName', 'toStreet', 'toPlzCity', 'decDate'] };
// Fields that describe the receiver (shown under "the office you write to").
export const LETTER_TO = ['ctype', 'toName', 'toStreet', 'toPlzCity', 'ref', 'total', 'rate', 'start', 'endDate', 'decDate', 'reason'];
export const LETTER_FILE = { installment: 'Ratenzahlung', schufa: 'SCHUFA-Datenkopie', cancel: 'Kuendigung', objection: 'Widerspruch' };

// «اشرحلي رسالتي»: common German official letters, what they mean, the usual deadline and what to do.
export const EXPLAIN = [
  { id: 'mahnung', icon: '💶', de: 'Zahlungserinnerung / Mahnung',
    Ara: { title: 'تذكير بالدفع أو إنذار (Mahnung)', what: 'شركة أو دائرة تكلك إن عليك فلوس ما دفعتها لحد هسه.', time: 'الموعد مكتوب بالرسالة (Zahlungsfrist). كل ما تتأخر تزيد رسوم الإنذار.', todo: ['تأكد إن الفاتورة صحيحة وإنك فعلاً ما دفعت.', 'إذا تكدر، ادفع قبل الموعد.', 'إذا ما تكدر تدفع كلها، اطلب تقسيط برسالة (موجودة بالتطبيق).', 'إذا الفاتورة غلط، اعترض كتابياً واحتفظ بنسخة.'] },
    Kur: { title: 'بیرخستنەوەی پارەدان (Mahnung)', what: 'کۆمپانیایەک یان فەرمانگەیەک دەڵێت پارەیەکت لەسەرە کە نەتداوە.', time: 'ماوەکە لە نامەکەدا نووسراوە. هەتا دوابکەویت تێچوو زیاد دەبێت.', todo: ['دڵنیابە پسوولەکە ڕاستە.', 'ئەگەر دەتوانیت پێش ماوەکە بیدە.', 'ئەگەر ناتوانیت، داوای قیست بکە (لە بەرنامەکەدا هەیە).', 'ئەگەر هەڵەیە، بە نووسین ناڕەزایی دەرببڕە.'] } },
  { id: 'inkasso', icon: '📨', de: 'Inkassoschreiben',
    Ara: { title: 'رسالة شركة تحصيل ديون (Inkasso)', what: 'شركة تحصيل تطالبك بدين لصالح شركة ثانية، وعادةً تضيف رسوم.', time: 'الموعد بالرسالة. لا تهملها، بس لا تدفع قبل ما تتأكد.', todo: ['تأكد إن الدين حقيقي وإنه مالك، وإن اسم الشركة الأصلية مكتوب.', 'اطلب منهم كتابياً تفاصيل الدين (Forderungsaufstellung) إذا مو واضح.', 'انتبه من الرسائل المزيّفة: لا تدفع لحساب بالخارج ولا من رابط مشبوه.', 'إذا الدين صحيح وما تكدر تدفعه كله، اطلب تقسيط.', 'تكدر تسأل مركز حماية المستهلك (Verbraucherzentrale).'] },
    Kur: { title: 'نامەی کۆمپانیای کۆکردنەوەی قەرز (Inkasso)', what: 'کۆمپانیایەک داوای قەرزێک دەکات بۆ کۆمپانیایەکی تر و زۆرجار تێچوو زیاد دەکات.', time: 'ماوەکە لە نامەکەدایە. پشتگوێی مەخە، بەڵام پێش دڵنیابوون پارە مەدە.', todo: ['دڵنیابە قەرزەکە ڕاستە و هی خۆتە.', 'بە نووسین وردەکاری قەرزەکە داوا بکە.', 'ئاگاداری نامەی ساختە بە: پارە بۆ ئەکاونتی دەرەوە یان لینکی گوماناوی مەدە.', 'ئەگەر ڕاستە و ناتوانیت هەمووی بدەیت، داوای قیست بکە.'] } },
  { id: 'mahnbescheid', icon: '⚖️', de: 'Mahnbescheid (vom Amtsgericht)',
    Ara: { title: 'أمر دفع من المحكمة (Mahnbescheid)', what: 'رسالة صفرة من المحكمة (Amtsgericht) بطلب من شخص أو شركة يطالبك بفلوس. المحكمة ما تأكدت إن الطلب صحيح.', time: 'مهم جداً: عندك أسبوعين بس من وصولها.', todo: ['إذا الطلب صحيح، ادفع أو اتفق ويّا الجهة.', 'إذا الطلب غلط أو مبالغ بيه، أشّر على استمارة الاعتراض (Widerspruch) اللي ويّا الرسالة وابعثها للمحكمة خلال أسبوعين.', 'إذا ما سويت شي، ممكن يصير «Vollstreckungsbescheid» ويحجزون على فلوسك.', 'اسأل محامي أو Verbraucherzentrale إذا مو متأكد.'] },
    Kur: { title: 'فەرمانی پارەدان لە دادگاوە (Mahnbescheid)', what: 'نامەیەکی زەرد لە دادگاوە بە داوای کەسێک یان کۆمپانیایەک. دادگا دڵنیا نەبووەتەوە کە داواکە ڕاستە.', time: 'زۆر گرنگ: تەنها دوو هەفتەت هەیە.', todo: ['ئەگەر ڕاستە، بیدە یان ڕێکبکەوە.', 'ئەگەر هەڵەیە، فۆرمی ناڕەزایی (Widerspruch) پڕ بکەرەوە و لە ماوەی دوو هەفتەدا بۆ دادگای بنێرە.', 'ئەگەر هیچ نەکەیت، دەتوانن پارەکەت دەست بەسەردا بگرن.'] } },
  { id: 'bescheid', icon: '📄', de: 'Bescheid (z. B. Jobcenter, Familienkasse, Elterngeldstelle)',
    Ara: { title: 'قرار رسمي (Bescheid)', what: 'قرار من دائرة على طلبك أو عن مساعدتك: موافقة، أو رفض، أو تغيير بالمبلغ، أو طلب ترجيع فلوس.', time: 'إذا ما توافق: الاعتراض عادةً خلال شهر من وصوله. الموعد مكتوب بآخر القرار تحت «Rechtsbehelfsbelehrung».', todo: ['اقرا المبلغ والفترة والسبب.', 'إذا القرار غلط، ابعث رسالة اعتراض (Widerspruch) قبل نهاية الشهر. الرسالة موجودة بالتطبيق.', 'احتفظ بالقرار وبنسخة من الاعتراض وإثبات الإرسال.', 'إذا القرار يطلب ترجيع فلوس كثيرة، اسأل مكتب استشارة.'] },
    Kur: { title: 'بڕیاری فەرمی (Bescheid)', what: 'بڕیارێک لە فەرمانگەیەکەوە: ڕەزامەندی، ڕەتکردنەوە، گۆڕینی بڕ یان داوای گەڕاندنەوەی پارە.', time: 'ناڕەزایی زۆرجار لە ماوەی یەک مانگدایە. لە کۆتایی بڕیارەکەدا نووسراوە.', todo: ['بڕ، ماوە و هۆکار بخوێنەرەوە.', 'ئەگەر هەڵەیە، پێش کۆتایی مانگ نامەی ناڕەزایی بنێرە (لە بەرنامەکەدا هەیە).', 'بڕیارەکە و کۆپیی ناڕەزاییەکە بپارێزە.'] } },
  { id: 'anhoerung', icon: '🗣️', de: 'Anhörung',
    Ara: { title: 'طلب سماع رأيك (Anhörung)', what: 'الدائرة ناوية تاخذ قرار ضدك (مثلاً تقطع مساعدة، أو تطلب ترجيع فلوس، أو غرامة)، وقبل القرار تعطيك فرصة تشرح.', time: 'الموعد مكتوب بالرسالة، عادةً أسبوعين لـ4 أسابيع.', todo: ['هاي فرصتك. جاوب كتابياً قبل الموعد واشرح وضعك.', 'أرفق الأوراق اللي تثبت كلامك.', 'إذا ما جاوبت، الدائرة تقرر بدون رأيك.', 'إذا الموضوع غرامة مرور، ما لازم تعترف بشي. اكتفي بالمعلومات الشخصية واسأل محامي إذا محتار.'] },
    Kur: { title: 'گوێگرتن لە ڕات (Anhörung)', what: 'فەرمانگەکە دەیەوێت بڕیارێک دژی تۆ بدات و پێش ئەوە دەرفەتت دەداتێ ڕوونکردنەوە بدەیت.', time: 'ماوەکە لە نامەکەدایە، زۆرجار 2 تا 4 هەفتە.', todo: ['ئەمە دەرفەتی تۆیە. پێش ماوەکە بە نووسین وەڵام بدەرەوە.', 'بەڵگەنامەکان هاوپێچ بکە.', 'ئەگەر وەڵام نەدەیتەوە، بێ ڕای تۆ بڕیار دەدەن.'] } },
  { id: 'einladung', icon: '🏢', de: 'Einladung / Meldeaufforderung (Jobcenter, Agentur für Arbeit)',
    Ara: { title: 'دعوة لموعد بالجوب سنتر (Einladung)', what: 'الجوب سنتر أو دائرة العمل يطلبون تحضر بموعد محدد.', time: 'التاريخ والساعة مكتوبة بالرسالة.', todo: ['احضر بالموعد وجيب الأوراق المطلوبة.', 'إذا ما تكدر تحضر لسبب مهم (مثل مرض)، بلّغهم قبل الموعد وجيب إثبات، مثلاً تقرير مرضي.', 'الغياب بدون سبب مقبول ممكن يقلّل مساعدتك.', 'تكدر تجيب وياك شخص يساعدك بالترجمة.'] },
    Kur: { title: 'بانگهێشت بۆ ژوان لە Jobcenter', what: 'Jobcenter یان فەرمانگەی کار داوا دەکەن لە کاتێکی دیاریکراودا ئامادە بیت.', time: 'ڕۆژ و کاتەکە لە نامەکەدایە.', todo: ['لە کاتی خۆیدا ئامادە بە و بەڵگەنامەکان بهێنە.', 'ئەگەر بە هۆیەکی گرنگ ناتوانیت بێیت، پێشتر ئاگاداریان بکەرەوە و بەڵگە بهێنە.', 'ئامادەنەبوون بێ هۆی قبووڵکراو لەوانەیە یارمەتییەکەت کەم بکاتەوە.'] } },
  { id: 'mitwirkung', icon: '📎', de: 'Aufforderung zur Mitwirkung / Unterlagen nachreichen',
    Ara: { title: 'طلب أوراق ناقصة (Mitwirkung)', what: 'الدائرة تحتاج أوراق حتى تكمل معاملتك أو تستمر بالمساعدة.', time: 'الموعد بالرسالة. إذا تأخرت ممكن يوكفون المساعدة أو يرفضون الطلب.', todo: ['جهّز الأوراق المطلوبة بالضبط.', 'ابعث نسخ مو أصليات، إلا إذا طلبوا الأصل.', 'اكتب رقم الملف على كل ورقة، واحتفظ بإثبات الإرسال.', 'إذا ورقة ما تكدر تجيبها، بلّغهم كتابياً وشرح السبب.'] },
    Kur: { title: 'داوای بەڵگەنامەی کەم (Mitwirkung)', what: 'فەرمانگەکە بەڵگەنامەی پێویستە بۆ تەواوکردنی مامەڵەکەت.', time: 'ماوەکە لە نامەکەدایە. دواکەوتن لەوانەیە یارمەتییەکە ڕابگرێت.', todo: ['بەڵگەنامەکان ئامادە بکە.', 'کۆپی بنێرە نەک ئەسڵ، مەگەر داوای ئەسڵ بکەن.', 'ژمارەی دۆسیە لەسەر هەموو پەڕەیەک بنووسە.'] } },
  { id: 'bussgeld', icon: '🚗', de: 'Bußgeldbescheid',
    Ara: { title: 'غرامة مخالفة (Bußgeldbescheid)', what: 'قرار غرامة، غالباً مرور: سرعة، أو وقوف، أو إشارة.', time: 'الاعتراض (Einspruch) خلال أسبوعين من وصوله.', todo: ['تأكد من التاريخ والمكان ورقم السيارة.', 'إذا صحيحة، ادفع بالموعد للحساب المكتوب بالقرار بس.', 'إذا غلط، اعترض كتابياً خلال أسبوعين.', 'إذا بيها نقاط أو سحب إجازة، اسأل محامي مرور.'] },
    Kur: { title: 'غەرامەی سەرپێچی (Bußgeldbescheid)', what: 'بڕیاری غەرامە، زۆرجار هاتوچۆ.', time: 'ناڕەزایی (Einspruch) لە ماوەی دوو هەفتەدا.', todo: ['ڕۆژ، شوێن و ژمارەی ئۆتۆمبێل بپشکنە.', 'ئەگەر ڕاستە، تەنها بۆ ئەو ئەکاونتەی لە بڕیارەکەدایە بیدە.', 'ئەگەر هەڵەیە، لە ماوەی دوو هەفتەدا ناڕەزایی دەرببڕە.'] } },
  { id: 'nebenkosten', icon: '🏠', de: 'Nebenkostenabrechnung',
    Ara: { title: 'حساب تكاليف السكن الإضافية (Nebenkostenabrechnung)', what: 'المؤجر يحسب التكاليف الإضافية للسنة (ماي، تدفئة، زبالة…)، ويطلع إما تدفع زيادة أو ترجعلك فلوس.', time: 'المؤجر لازم يبعثه خلال 12 شهر من نهاية فترة الحساب. وإنت عندك 12 شهر من وصوله حتى تعترض.', todo: ['قارن الحساب ويّا الدفعات اللي دفعتها.', 'تكدر تطلب تشوف الفواتير الأصلية.', 'إذا تاخذ مساعدة (جوب سنتر)، ودّيله الحساب لأن ممكن يدفعه.', 'إذا مشكوك بيه، اسأل جمعية المستأجرين (Mieterverein).'] },
    Kur: { title: 'حیسابی تێچووە زیادەکانی خانوو', what: 'خاوەن ماڵ تێچووە زیادەکانی ساڵ حیساب دەکات و یان دەبێت زیاتر بدەیت یان پارەت بۆ دەگەڕێتەوە.', time: 'خاوەن ماڵ دەبێت لە ماوەی 12 مانگدا بینێرێت. تۆش 12 مانگت هەیە بۆ ناڕەزایی.', todo: ['حیسابەکە لەگەڵ ئەو پارەیەی داوتە بەراورد بکە.', 'دەتوانیت داوای بینینی پسوولە ئەسڵییەکان بکەیت.', 'ئەگەر Jobcenter یارمەتیت دەدات، حیسابەکەی بۆ ببە.'] } },
  { id: 'steuer', icon: '🧾', de: 'Steuerbescheid (Finanzamt)',
    Ara: { title: 'قرار الضريبة (Steuerbescheid)', what: 'دائرة الضريبة حسبت ضريبتك للسنة: إما ترجعلك فلوس أو تدفع.', time: 'الاعتراض (Einspruch) خلال شهر من وصوله.', todo: ['قارن القرار ويّا التصريح الضريبي اللي قدّمته.', 'إذا أكو غلط، اعترض خلال شهر، وتكدر تعترض أونلاين من ELSTER.', 'إذا لازم تدفع، ادفع بالموعد أو اطلب تقسيط من الدائرة.'] },
    Kur: { title: 'بڕیاری باج (Steuerbescheid)', what: 'فەرمانگەی باج باجی ساڵەکەت حیساب کردووە: یان پارەت بۆ دەگەڕێتەوە یان دەبێت بیدەیت.', time: 'ناڕەزایی لە ماوەی یەک مانگدا.', todo: ['بڕیارەکە لەگەڵ ڕاگەیاندنی باجەکەت بەراورد بکە.', 'ئەگەر هەڵە هەیە، لە ماوەی یەک مانگدا ناڕەزایی بکە (لە ELSTERیش دەکرێت).'] } },
];
