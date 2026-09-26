// Suggests a Latin spelling for Arabic / Kurdish names, the way Iraqi names
// usually appear in European residence permits. It is only a suggestion:
// the person always checks it against their own documents.

const NAMES = {
  'محمد': 'Mohammed', 'احمد': 'Ahmed', 'علي': 'Ali', 'حسين': 'Hussein', 'حسن': 'Hassan', 'هشام': 'Husham',
  'اميد': 'Omid', 'ئوميد': 'Omid', 'رجب': 'Rajab', 'عمر': 'Omar', 'عثمان': 'Othman', 'خالد': 'Khalid',
  'محمود': 'Mahmood', 'مصطفى': 'Mustafa', 'ابراهيم': 'Ibrahim', 'اسماعيل': 'Ismail', 'يوسف': 'Yousif',
  'جاسم': 'Jasim', 'كاظم': 'Kadhim', 'جعفر': 'Jaafar', 'عباس': 'Abbas', 'كريم': 'Kareem', 'سعد': 'Saad',
  'سعيد': 'Saeed', 'صالح': 'Salih', 'حيدر': 'Haider', 'مهدي': 'Mahdi', 'رضا': 'Ridha', 'قاسم': 'Qasim',
  'حمزه': 'Hamza', 'زيد': 'Zaid', 'سيف': 'Saif', 'ياسر': 'Yasir', 'ياسين': 'Yaseen', 'حسنين': 'Hasanain',
  'مرتضى': 'Murtadha', 'مجتبى': 'Mujtaba', 'منتظر': 'Muntadhar', 'مؤمل': 'Muammal', 'علاء': 'Alaa',
  'ضياء': 'Dhiaa', 'وسام': 'Wisam', 'سلام': 'Salam', 'كامل': 'Kamil', 'جمال': 'Jamal', 'كمال': 'Kamal',
  'فاضل': 'Fadhil', 'عادل': 'Adil', 'نبيل': 'Nabil', 'طارق': 'Tariq', 'ماجد': 'Majid', 'حميد': 'Hameed',
  'رشيد': 'Rasheed', 'سالم': 'Salim', 'ناصر': 'Nasir', 'منصور': 'Mansoor', 'فراس': 'Firas', 'داود': 'Dawood',
  'سليمان': 'Sulaiman', 'موسى': 'Musa', 'عيسى': 'Isa', 'يعقوب': 'Yaqoob', 'الياس': 'Elias', 'يونس': 'Younis',
  'نوح': 'Nooh', 'ادم': 'Adam', 'امير': 'Ameer', 'مالك': 'Malik', 'انس': 'Anas', 'بلال': 'Bilal',
  'حمد': 'Hamad', 'فهد': 'Fahad', 'غازي': 'Ghazi', 'حازم': 'Hazim', 'باسم': 'Basim', 'هاشم': 'Hashim',
  'نعمان': 'Numan', 'لؤي': 'Luay', 'رعد': 'Raad', 'برهان': 'Burhan', 'صباح': 'Sabah', 'نجم': 'Najm',
  'شاكر': 'Shakir', 'جبار': 'Jabbar', 'ستار': 'Sattar', 'عزيز': 'Aziz', 'نوري': 'Noori', 'فوزي': 'Fawzi',
  'عدنان': 'Adnan', 'شهاب': 'Shihab', 'وليد': 'Waleed', 'خليل': 'Khalil', 'جليل': 'Jaleel', 'محسن': 'Muhsin',
  'حسام': 'Husam', 'عمار': 'Ammar', 'اياد': 'Iyad', 'زياد': 'Ziyad', 'نزار': 'Nizar', 'ثامر': 'Thamir',
  'عامر': 'Amir', 'مازن': 'Mazin', 'صلاح': 'Salah', 'فلاح': 'Falah', 'نجاح': 'Najah', 'رياض': 'Riyadh',
  'فيصل': 'Faisal', 'اسامه': 'Osama', 'مهند': 'Muhanad', 'احسان': 'Ihsan', 'رافد': 'Rafid', 'قيس': 'Qais',
  'زينب': 'Zainab', 'فاطمه': 'Fatima', 'مريم': 'Maryam', 'نور': 'Noor', 'هدى': 'Huda', 'ساره': 'Sara',
  'رقيه': 'Ruqaya', 'زهراء': 'Zahraa', 'ايه': 'Aya', 'منى': 'Muna', 'سلمى': 'Salma', 'ليلى': 'Layla',
  'امل': 'Amal', 'دعاء': 'Duaa', 'اسراء': 'Israa', 'شيماء': 'Shaimaa', 'رنا': 'Rana', 'ريم': 'Reem',
  'خديجه': 'Khadija', 'عائشه': 'Aisha', 'حوراء': 'Hawraa', 'بتول': 'Batool', 'ايات': 'Ayat', 'غفران': 'Ghufran',
  'سجى': 'Saja', 'تبارك': 'Tabarak', 'هبه': 'Hiba', 'رحمه': 'Rahma', 'نادیه': 'Nadia', 'ناديه': 'Nadia',
  'سعاد': 'Suad', 'وفاء': 'Wafaa', 'انتصار': 'Intisar', 'بشرى': 'Bushra', 'سهام': 'Siham', 'ابتسام': 'Ibtisam',
  'ازاد': 'Azad', 'ئازاد': 'Azad', 'اراس': 'Aras', 'ئاراس': 'Aras', 'شيركو': 'Sherko', 'شێرکۆ': 'Sherko',
  'هاوكار': 'Hawkar', 'هاوکار': 'Hawkar', 'كاوه': 'Kawa', 'کاوە': 'Kawa', 'ريبوار': 'Rebwar', 'ڕێبوار': 'Rebwar',
  'دلشاد': 'Dilshad', 'دڵشاد': 'Dilshad', 'سردار': 'Sardar', 'سەردار': 'Sardar', 'هيمن': 'Hemin', 'هێمن': 'Hemin',
  'بختيار': 'Bakhtiyar', 'بەختیار': 'Bakhtiyar', 'نوزاد': 'Nawzad', 'نەوزاد': 'Nawzad', 'جوان': 'Jwan',
  'شيلان': 'Shilan', 'شیلان': 'Shilan', 'روناك': 'Ronak', 'ڕووناک': 'Ronak', 'نازدار': 'Nazdar',
  'بيريفان': 'Berivan', 'ئەحمەد': 'Ahmed', 'محەمەد': 'Mohammed', 'عەلی': 'Ali', 'حەسەن': 'Hassan',
  'هیشام': 'Husham', 'کەریم': 'Kareem', 'مستەفا': 'Mustafa', 'ئیبراهیم': 'Ibrahim', 'عومەر': 'Omar',
  'عبدالله': 'Abdullah', 'الله': 'Allah',
  'كوثر': 'Kawthar', 'نعيم': 'Naeem', 'سجاد': 'Sajjad', 'بشير': 'Basheer', 'شكر': 'Shukur', 'بلسم': 'Balsam',
  'رحمن': 'Rahman', 'رزاق': 'Razzaq', 'رحيم': 'Raheem', 'وهاب': 'Wahab', 'هادي': 'Hadi', 'خالق': 'Khaliq',
  'قادر': 'Qadir', 'منعم': 'Munim', 'غني': 'Ghani', 'لطيف': 'Lateef', 'مجيد': 'Majeed', 'حكيم': 'Hakeem',
  'عظيم': 'Adheem', 'امام': 'Imam', 'زهره': 'Zahra', 'جبوري': 'Jubouri', 'عبيدي': 'Obaidi', 'دليمي': 'Dulaimi',
  'تميمي': 'Tamimi', 'ربيعي': 'Rubaie', 'خزرجي': 'Khazraji', 'شمري': 'Shammari', 'زبيدي': 'Zubaidi', 'بياتي': 'Bayati',
};

const LETTERS = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'dh', 'ط': 't', 'ظ': 'dh',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a',
  'و': 'w', 'ي': 'y', 'ى': 'a', 'ء': '', 'ئ': 'e', 'ؤ': 'o', 'گ': 'g', 'چ': 'ch', 'پ': 'p', 'ڤ': 'v',
  'ژ': 'zh', 'ک': 'k', 'ی': 'y', 'ە': 'a', 'ێ': 'e', 'ۆ': 'o', 'ۇ': 'u', 'ڕ': 'r', 'ڵ': 'l', 'ھ': 'h',
};
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// For dictionary lookups: one spelling per name.
const key = (w) => w.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى$/, 'ى').replace(/ي$/, 'ي');

function byLetters(word) {
  const chars = [...word];
  let out = '';
  chars.forEach((ch, i) => {
    const prev = out.slice(-1);
    const afterConsonant = prev && !VOWELS.has(prev);
    const last = i === chars.length - 1;
    if (ch === 'و') out += i === 0 ? 'w' : afterConsonant ? 'o' : 'w';
    else if (ch === 'ي' || ch === 'ی') out += i === 0 ? 'y' : chars[i - 1] === 'ع' ? 'ee' : afterConsonant ? (last ? 'i' : 'ee') : 'y';
    else if ((ch === 'ه' || ch === 'ە') && last && afterConsonant) out += 'a';
    else if (ch === 'ع' && (VOWELS.has(prev) || (chars[i + 1] === 'ا'))) out += '';
    else {
      const l = LETTERS[ch];
      if (l === undefined) { out += /[a-z]/i.test(ch) ? ch.toLowerCase() : ''; return; }
      // Arabic writes no short vowels: open the first syllable ("كرم" → "karam").
      if (i === 1 && out.length && !VOWELS.has(out.slice(-1)) && l && !VOWELS.has(l[0]) && !(ch === 'و' || ch === 'ي')) out += 'a';
      out += l;
    }
  });
  return out.replace(/aa+/g, 'aa').replace(/([^aeiou])\1\1+/g, '$1$1');
}

const cap = (s) => s.split('-').map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join('-');

function word(w) {
  const k = key(w);
  if (NAMES[k]) return NAMES[k];
  if (/^عبد./.test(k)) {  // عبدالكريم → Abdulkareem
    const rest = k.slice(3).replace(/^ال/, '');
    return 'Abdul' + (NAMES[rest] || byLetters(rest)).toLowerCase();
  }
  if (/^ال../.test(k)) return 'Al-' + cap(NAMES[k.slice(2)] || byLetters(k.slice(2)));
  return cap(byLetters(k));
}

export function toLatin(text) {
  const words = String(text || '')
    .replace(/[ً-ْٰـ‌]/g, '')  // harakat, tatweel, ZWNJ
    .trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (let i = 0; i < words.length; i++) {
    let w = words[i];
    if (w === 'عبد' && words[i + 1]) { w += words[i + 1]; i++; }  // "عبد الله" → one name
    out.push(word(w));
  }
  return out.join(' ');
}

// True when the text still has Arabic-script letters in it.
export const hasArabic = (s) => /[؀-ۿ]/.test(s || '');
