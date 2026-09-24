// Form definition. Field keys follow the official numbering (aNN...): the
// two digits are the field's position in the QR payload.

// type: text | num | date | pick ; list: key in LISTS or 'opt:<name>'
export const FIELDS = {
  a07name1:            { type: 'text', req: true },
  a06name2:            { type: 'text', req: true },
  a09name3:            { type: 'text', req: true },
  a08name4:            { type: 'text' },
  a11motherName:       { type: 'text', req: true },
  a10motherFatherName: { type: 'text', req: true },
  a04birthLoc:         { type: 'text', req: true },
  a05birthDate:        { type: 'date', req: true },

  a01gender:           { type: 'pick', list: 'opt:gender', req: true },
  a33religion:         { type: 'pick', list: 'opt:religion', req: true },
  a02mariage:          { type: 'pick', list: 'opt:mariageStatus', req: true },
  a03bloodGroup:       { type: 'pick', list: 'opt:bloodGroups' },
  a35disabilities:     { type: 'text', req: true },
  a34job:              { type: 'text' },
  a31passport:         { type: 'text' },
  a40phone:            { type: 'num', req: true, tel: true },

  a27fatherIsLive:     { type: 'pick', list: 'opt:fatherIsLive' },
  a26fatherCountry:    { type: 'pick', list: 'country' },
  a25fatherBirthLoc:   { type: 'pick', list: 'prov' },
  a30motherIsLive:     { type: 'pick', list: 'opt:motherIsLive' },
  a29motherCountry:    { type: 'pick', list: 'country' },
  a28motherBirthLoc:   { type: 'pick', list: 'prov' },

  a12office:           { type: 'pick', list: 'office', req: true },
  a13bookNo:           { type: 'num', req: true },
  a14pageNo:           { type: 'num', req: true },

  a15shProv:           { type: 'pick', list: 'prov', req: true },
  a16shOffice:         { type: 'pick', list: 'sh' },
  a17shNo:             { type: 'num' },
  a18shDate:           { type: 'date' },
  a19shPageNo:         { type: 'num' },
  a20shYear:           { type: 'num' },
  a21shLawItem:        { type: 'pick', list: 'lawitem', req: true },

  a39addrCountry:      { type: 'pick', list: 'country' },
  a38addrProv:         { type: 'pick', list: 'prov' },
  a37addrM:            { type: 'text' },
  a36addrStNo:         { type: 'text' },
  a42addrBuildingNo:   { type: 'text' },
  a41addrOther:        { type: 'text' },
  a22addrOffice:       { type: 'pick', list: 'addr' },
  a23addrFormNo:       { type: 'num' },
  a24addrFromDate:     { type: 'date' },
};

// Constant field the official form always carries.
export const FIXED = { a32: '-' };

export const SECTIONS = [
  { id: 'names',  icon: 'user',   keys: ['a07name1', 'a06name2', 'a09name3', 'a08name4', 'a11motherName', 'a10motherFatherName', 'a04birthLoc', 'a05birthDate'] },
  { id: 'person', icon: 'id',     keys: ['a01gender', 'a33religion', 'a02mariage', 'a03bloodGroup', 'a35disabilities', 'a34job', 'a31passport', 'a40phone'] },
  { id: 'parents',icon: 'family', keys: ['a27fatherIsLive', 'a26fatherCountry', 'a25fatherBirthLoc', 'a30motherIsLive', 'a29motherCountry', 'a28motherBirthLoc'] },
  { id: 'civil',  icon: 'book',   keys: ['a12office', 'a13bookNo', 'a14pageNo'] },
  { id: 'nation', icon: 'stamp',  keys: ['a15shProv', 'a16shOffice', 'a17shNo', 'a18shDate', 'a19shPageNo', 'a20shYear', 'a21shLawItem'] },
  { id: 'home',   icon: 'home',   keys: ['a39addrCountry', 'a38addrProv', 'a37addrM', 'a36addrStNo', 'a42addrBuildingNo', 'a41addrOther', 'a22addrOffice', 'a23addrFormNo', 'a24addrFromDate'] },
];

// Labels shown while filling in (from the official application).
export const LABELS = {
  Ara: {
    a07name1: 'الاسم', a06name2: 'اسم الأب', a09name3: 'اسم الجد', a08name4: 'اللقب (إن وجد)',
    a11motherName: 'اسم الأم', a10motherFatherName: 'اسم والد الأم', a04birthLoc: 'محل الولادة', a05birthDate: 'تاريخ الولادة',
    a01gender: 'الجنس', a33religion: 'الديانة', a02mariage: 'الحالة الزوجية', a03bloodGroup: 'فصيلة الدم',
    a35disabilities: 'العاهات الظاهرة', a34job: 'المهنة', a31passport: 'رقم جواز السفر', a40phone: 'رقم الهاتف',
    a27fatherIsLive: 'الحالة الحياتية للأب', a26fatherCountry: 'جنسية الأب الأصلية', a25fatherBirthLoc: 'محل ولادة الأب',
    a30motherIsLive: 'الحالة الحياتية للأم', a29motherCountry: 'جنسية الأم الأصلية', a28motherBirthLoc: 'محل ولادة الأم',
    a12office: 'دائرة الأحوال المدنية', a13bookNo: 'رقم السجل', a14pageNo: 'رقم الصحيفة',
    a15shProv: 'اسم المحافظة', a16shOffice: 'جهة الإصدار', a17shNo: 'رقم شهادة الجنسية', a18shDate: 'تاريخ إصدار الشهادة',
    a19shPageNo: 'رقم المحفظة', a20shYear: 'سنة التسجيل', a21shLawItem: 'المادة القانونية',
    a39addrCountry: 'البلد', a38addrProv: 'المحافظة', a37addrM: 'المحلة', a36addrStNo: 'الزقاق / الشارع',
    a42addrBuildingNo: 'الدار / الشقة', a41addrOther: 'المقاطعة / القرية', a22addrOffice: 'مكتب المعلومات',
    a23addrFormNo: 'رقم الاستمارة', a24addrFromDate: 'تاريخ تنظيم الاستمارة',
  },
  Kur: {
    a07name1: 'ناو', a06name2: 'ناوی باوک', a09name3: 'ناوی باپیر', a08name4: 'نازناو',
    a11motherName: 'ناوی دایک', a10motherFatherName: 'ناوی باوکی دایک', a04birthLoc: 'شوێنی لە دایکبوون', a05birthDate: 'ڕۆژی لە دایکبوون',
    a01gender: 'ڕەگەز', a33religion: 'ئایین', a02mariage: 'باری هاوسەرگیری', a03bloodGroup: 'گروپی خوێن',
    a35disabilities: 'کەم و کورییە دیارەکان', a34job: 'پیشە', a31passport: 'ژمارەی پاسپۆرت', a40phone: 'ژمارەی تەلەفۆن',
    a27fatherIsLive: 'باری ژیانی باوک', a26fatherCountry: 'ڕەگەزنامەی ڕەسەنی باوک', a25fatherBirthLoc: 'شوێنی لە دایکبوونی باوک',
    a30motherIsLive: 'باری ژیانی دایک', a29motherCountry: 'ڕەگەزنامەی ڕەسەنی دایک', a28motherBirthLoc: 'شوێنی لە دایکبوونی دایک',
    a12office: 'فەرمانگەی باری شارستانی', a13bookNo: 'ژمارەی تۆمار', a14pageNo: 'ژمارەی لاپەڕە',
    a15shProv: 'ناوی پارێزگا', a16shOffice: 'لایەنی دەرچوون', a17shNo: 'ژمارەی ڕەگەزنامە', a18shDate: 'ڕۆژی دەرچوونی ڕەگەزنامە',
    a19shPageNo: 'ژمارەی فایل', a20shYear: 'ساڵی تۆمار', a21shLawItem: 'ماددەی یاسایی',
    a39addrCountry: 'وڵات', a38addrProv: 'پارێزگا', a37addrM: 'گەڕەک', a36addrStNo: 'کۆڵان / شەقام',
    a42addrBuildingNo: 'خانوو / شوقە', a41addrOther: 'کەرت / گوند', a22addrOffice: 'نووسینگەی زانیاری',
    a23addrFormNo: 'ژمارەی فۆرم', a24addrFromDate: 'ڕۆژی ڕێکخستنی فۆرم',
  },
};

// Wording of the printed sheet (as on the official printout templates).
export const SHEET = {
  Ara: {
    head: ['جمهورية العراق', 'وزارة الداخلية', 'مديرية الاحوال المدنية والجوازات والاقامة', 'مديرية شؤون البطاقة الوطنية'],
    title: 'استمارة الحصول على البطاقة الوطنية',
    sec: ['البيانات الشخصية:', 'العنوان:', 'بطاقة السكن:', 'شهادة الجنسية العراقية:', 'هوية الاحوال المدنية:', 'بيانات الوالدين:'],
    sign: ['اسم وتوقيع المواطن / ولي الأمر', 'اسم وتوقيع مدخل البيانات', 'تأييد ضابط الجنسية'],
    l: {
      a04birthLoc: 'محل الولادة', a05birthDate: 'تاريخ الولادة',
      a07name1: 'الأسم', a06name2: 'أسم الأب', a09name3: 'أسم الجد', a08name4: 'اللقب', a11motherName: 'أسم الأم', a10motherFatherName: 'أسم والد الام',
      a01gender: 'الجنس', a33religion: 'الديانة', a02mariage: 'الحالة الزوجية', a34job: 'المهنة', a03bloodGroup: 'فصيلة الدم',
      a35disabilities: 'العاهات الظاهرة', a31passport: 'رقم جواز السفر',
      a39addrCountry: 'البلد', a38addrProv: 'المحافظة', a37addrM: 'المحلة', a36addrStNo: 'الزقاق / الشارع',
      a42addrBuildingNo: 'الدار / الشقة', a41addrOther: 'المقاطعة / القرية', a40phone: 'رقم الهاتف',
      a22addrOffice: 'مكتب معلومات', a23addrFormNo: 'رقم الاستمارة', a24addrFromDate: 'تاريخ تنظيم الاستمارة',
      a15shProv: 'اسم المحافظة', a16shOffice: 'جهة الاصدار', a17shNo: 'رقم شهادة الجنسية', a18shDate: 'تاريخ اصدار الشهادة',
      a19shPageNo: 'رقم المحفظة', a20shYear: 'سنة التسجيل', a21shLawItem: 'المادة القانونية',
      a12office: 'دائرة الاحوال المدنية', a13bookNo: 'رقم السجل', a14pageNo: 'رقم الصحيفة',
      a27fatherIsLive: 'الحالة الحياتية للاب', a26fatherCountry: 'جنسية الأب الاصلية', a25fatherBirthLoc: 'محل ولادة الأب',
      a30motherIsLive: 'الحالة الحياتية للأم', a29motherCountry: 'جنسية الام الاصلية', a28motherBirthLoc: 'محل ولادة الام',
    },
  },
  Kur: {
    head: ['کۆماری عیراق', 'وەزارەتی ناوخۆ', 'بەڕێوبەرایەتی گشتی ڕەگەزنامە', 'بەڕێوبەرایەتی کاروباری کارتی نیشتمانی'],
    title: 'فۆرمی داواکاری کارتی نیشتمانی',
    sec: ['زانیاری کەسی', 'ناونیشان', 'زانیاری کارتی نیشتەجێ بوون', 'بڕوانامەی ڕەگەزنامەی عیراقی', 'پێناسەی باری شارستانی', 'زانیاری باوان'],
    sign: ['ناو و ئیمزای هاووڵاتی / سەمیان', 'ناو و ئیمزای زانیاری پرکەرەوە', 'پشتگیری ئەفسەری ڕەگەزنامە'],
    l: {
      a04birthLoc: 'شوێنی لە دایک بوون', a05birthDate: 'رۆژی لە دایک بوون',
      a07name1: 'ناو', a06name2: 'ناوی باوک', a09name3: 'ناوی باپیر', a08name4: 'نازناو', a11motherName: 'ناوی دایک', a10motherFatherName: 'ناوی باوکی دایک',
      a01gender: 'رەگەز', a33religion: 'ئایین', a02mariage: 'باری هاوسەرگیری', a34job: 'پیشە', a03bloodGroup: 'گروپی خوێن',
      a35disabilities: 'کەم و کورییە دیارەکان', a31passport: 'ژمارەی پاسەپۆرت',
      a39addrCountry: 'وڵات', a38addrProv: 'پارێزگا', a37addrM: 'گەڕەک', a36addrStNo: 'کۆڵان / شەقام',
      a42addrBuildingNo: 'خانوو / شوقە', a41addrOther: 'ناوچە / دێ', a40phone: 'ژمارەی تەلەفۆن',
      a22addrOffice: 'نووسینگەی زانیاریەکان', a23addrFormNo: 'ژمارەی فۆرم', a24addrFromDate: 'ڕۆژی ڕێکخستنی فۆرم',
      a15shProv: 'ناوی پارێزگا', a16shOffice: 'لایەنی دەرکردن', a17shNo: 'ژمارەی ڕەگەزنامە', a18shDate: 'ڕۆژی دەرچوون',
      a19shPageNo: 'ژمارەی فایل', a20shYear: 'سالی تۆمار', a21shLawItem: 'برگەی یاسایی',
      a12office: 'ناوی فەرمانگە', a13bookNo: 'ژمارەی تۆمار', a14pageNo: 'ژمارەی پەڕە',
      a27fatherIsLive: 'باری ژیواری باوک', a26fatherCountry: 'ڕەگەزنامەی بنەڕەتی باوک', a25fatherBirthLoc: 'شوێنی لە دایک بوونی باوک',
      a30motherIsLive: 'باری ژیواری دایک', a29motherCountry: 'ڕەگەزنامەی بنەڕەتی دایک', a28motherBirthLoc: 'شوێنی لە دایک بوونی دایک',
    },
  },
};
