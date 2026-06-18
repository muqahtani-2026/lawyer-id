// ============================================================
// محلّل جريدة أم القرى — يفصل القرارات/المراسيم/اللوائح عن الأخبار
// محافظ ودقيق: لا يخترع أنظمة من عناوين مشوّهة. raw_text حرفيّ.
// ============================================================

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function toAsciiDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}
// تحويل الأرقام اللاتينيّة إلى عربيّة-هنديّة (النسق المعتمد للعرض والتخزين).
export function toArabicDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
}
const D = "[٠-٩0-9]";

// ============================================================
// تطبيع التاريخ إلى نسق موحّد ثابت: سنة/شهر/يوم بأرقام عربيّة-هنديّة + لاحقة هـ/م.
// يصحّح انعكاس OCR بمعرفة السنة (الجزء الأكبر، 3-4 خانات، قيمته كبيرة).
// لا يتنوّع النسق أبدًا: الشهر دائمًا في الوسط.
// ============================================================
export function normalizeHijriDate(raw: string | null): string | null {
  if (!raw) return null;
  const ascii = toAsciiDigits(raw);
  // التقاط ثلاثة أجزاء رقميّة مفصولة بـ /
  const m = ascii.match(/(\d{1,4})\s*\/\s*(\d{1,4})\s*\/\s*(\d{1,4})/);
  if (!m) return null;
  const parts = [+m[1], +m[2], +m[3]];

  // تحديد السنة: الجزء صاحب أكبر قيمة (السنة الهجريّة/الميلاديّة دائمًا الأكبر).
  // مثال: 12/2/1443 → السنة 1443 ؛ 1443/9/19 → السنة 1443.
  let yearIdx = 0;
  for (let i = 1; i < 3; i++) if (parts[i] > parts[yearIdx]) yearIdx = i;
  const year = parts[yearIdx];
  const rest = parts.filter((_, i) => i !== yearIdx);

  // من البقيّة: الشهر ≤ 12، واليوم هو الآخر. إن كان كلاهما ≤ 12 نُبقي ترتيب الظهور (شهر ثمّ يوم بعد إزالة السنة من الصدر).
  let month: number, day: number;
  const [a, b] = rest;
  if (a <= 12 && b > 12) { month = a; day = b; }
  else if (b <= 12 && a > 12) { month = b; day = a; }
  else { month = a; day = b; } // كلاهما ≤ 12: نعتمد الترتيب الأوّل = شهر

  if (!year || !month || !day || month > 12 || day > 31) return null;

  // تحديد اللاحقة: ميلاديّ إن السنة ≥ 1900، وإلّا هجريّ.
  const isGregorian = year >= 1900;
  const suffix = isGregorian ? "م" : "هـ";

  // بناء النسق الموحّد: سنة/شهر/يوم بأرقام عربيّة-هنديّة.
  const ymd = `${year}/${month}/${day}`;
  return toArabicDigits(ymd) + suffix;
}

const ANCHORS: { re: RegExp; type: string }[] = [
  { re: new RegExp(`مرسوم\\s+ملكي\\s+رقم\\s*\\(?\\s*م\\s*/?\\s*${D}+\\s*\\)?`, "g"), type: "royal_decree" },
  { re: new RegExp(`قرار\\s+مجلس\\s+الوزراء\\s+رقم\\s*\\(?\\s*${D}+\\s*\\)?`, "g"), type: "cabinet_decision" },
  { re: new RegExp(`قرار\\s+وزير[^\\n]{0,60}?رقم\\s*\\(?\\s*${D}+\\s*\\)?`, "g"), type: "ministerial_decision" },
  { re: new RegExp(`قرار\\s+رقم\\s*\\(?\\s*${D}+\\s*\\)?`, "g"), type: "cabinet_decision" },
];

export type ParsedEvent = {
  event_type: string;
  instrument_number: string | null;
  authority: string | null;
  event_date_hijri: string | null;
  event_sort: number | null;
  affected_articles: string | null;
  raw_text: string;
  parent_reference: string | null;
  parent_title: string | null;
  instrument_kind: string;
  match_keys: string[];
  title_is_clean: boolean;
};

export type ParseResult = { regulatory_section_found: boolean; events: ParsedEvent[] };

export function hijriToSort(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const a = toAsciiDigits(dateStr);
  const m = a.match(/(\d{3,4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  if (!y || !mo || !d) return null;
  return y * 10000 + mo * 100 + d;
}

// نصّ نظيف: بلا حرف استبدال �، طول معقول، لا يبدأ بكلمات حشو
function isCleanTitle(t: string | null): boolean {
  if (!t) return false;
  if (t.includes("\uFFFD")) return false; // تشويه استخلاص
  const clean = t.trim();
  if (clean.length < 8 || clean.length > 95) return false;
  // رفض عناوين الحشو الشائعة
  const junk = ["أو قرار", "بما ", "التي ", "ذات الصلة", "والأساسات", "بما لا", "النحو", "الموافق"];
  if (junk.some((j) => clean.includes(j))) return false;
  return true;
}

function extractHijriDate(seg: string): string | null {
  const m = seg.match(new RegExp(`وتاريخ\\s*(${D}{3,4}\\s*/\\s*${D}{1,2}\\s*/\\s*${D}{1,2}\\s*هـ?)`));
  if (m) return m[1].trim();
  const m2 = seg.match(new RegExp(`(${D}{3,4}\\s*/\\s*${D}{1,2}\\s*/\\s*${D}{1,2})\\s*هـ`));
  return m2 ? m2[1].trim() + "هـ" : null;
}

function extractOwnNumber(header: string): string | null {
  const royal = header.match(new RegExp(`رقم\\s*\\(?\\s*م\\s*/?\\s*(${D}+)`));
  if (royal) return "م/" + toAsciiDigits(royal[1]);
  const num = header.match(new RegExp(`رقم\\s*\\(?\\s*(${D}+)`));
  return num ? toAsciiDigits(num[1]) : null;
}

// المرجع الأمّ: نقبل فقط رقم مرسوم ملكيّ (م/NN) — البصمة الموثوقة للنظام الأمّ.
// أرقام القرارات/المذكرات لا تُعتمد مرجعًا (كثيرة التشابه/الضوضاء).
function extractParentReference(seg: string): string | null {
  const royal = seg.match(new RegExp(`(?:الصادر|الصادرة)[^\\n]{0,50}?بالمر?سوم\\s+الملكي(?:\\s+الكريم)?\\s+رقم\\s*\\(?\\s*م\\s*/?\\s*(${D}+)`));
  if (royal) return "م/" + toAsciiDigits(royal[1]);
  return null;
}

// اسم النظام/اللائحة الأمّ — التقاط شَرِه حتّى فاصل قويّ، ثمّ تنظيف.
function extractParentTitle(seg: string): { title: string | null; kind: string } {
  const STOP = "الصادر|الصادرة|المُوافق|الموافق|بالمرسوم|بالمر|بقرار|على النحو|رقم|وتاريخ|،|\\.|\\n";
  const grab = (re: RegExp): string | null => {
    const m = seg.match(re);
    if (!m) return null;
    return m[1].replace(/\s+/g, " ").trim();
  };
  let t = grab(new RegExp(`اللائحة\\s+التنفيذية\\s+لنظام\\s+(.+?)(?:${STOP})`));
  if (t && isCleanTitle("اللائحة التنفيذية لنظام " + t)) return { title: "اللائحة التنفيذية لنظام " + t, kind: "executive_regulation" };
  t = grab(new RegExp(`(?:تعديل|على)\\s+نظام\\s+(.+?)(?:${STOP})`));
  if (t && isCleanTitle("نظام " + t)) return { title: "نظام " + t, kind: "system" };
  t = grab(new RegExp(`(قواعد\\s+وإجراءات\\s+.+?|الترتيب\\s+التنظيمي\\s+.+?)(?:${STOP})`));
  if (t && isCleanTitle(t)) return { title: t, kind: "rules" };
  t = grab(new RegExp(`(الاتفاقية\\s+.+?)(?:${STOP})`));
  if (t && isCleanTitle(t)) return { title: t, kind: "agreement" };
  return { title: null, kind: "system" };
}

function extractAuthority(header: string, seg: string): string | null {
  if (/قرار\s+مجلس\s+الوزراء|إن\s+مجلس\s+الوزراء/.test(header + seg)) return "مجلس الوزراء";
  if (/مرسوم\s+ملكي/.test(header)) return "مرسوم ملكيّ";
  const min = seg.match(/قرار\s+(وزير\s+[^\n،(]{2,30}?)\s*رقم/);
  if (min) return min[1].trim();
  if (/البنك\s+المركزي/.test(seg)) return "البنك المركزي السعودي";
  if (/النيابة\s+العامة/.test(seg)) return "النيابة العامة";
  return null;
}

function extractAffectedArticles(seg: string): string | null {
  const ms = [...seg.matchAll(new RegExp(`المادة\\s*\\(?\\s*(${D}{1,3})\\s*\\)?`, "g"))];
  const nums = [...new Set(ms.map((m) => toAsciiDigits(m[1])))].slice(0, 25);
  return nums.length ? nums.join("، ") : null;
}

function refineEventType(anchorType: string, seg: string): string {
  const head = seg.slice(0, 400);
  if (/إلغاء/.test(head) && !/إلغاء\s+الفقرة|إلغاء\s+المادة/.test(head)) return "repealed";
  if (/تعديل/.test(head)) return "amended";
  if (/اللائحة\s+التنفيذية/.test(head)) return "executive_regulation";
  if (/قواعد\s+وإجراءات|قواعد\s+تنظيم/.test(head)) return "rules";
  return anchorType;
}

function findRegulatoryStart(text: string): number {
  let earliest = -1;
  for (const a of ANCHORS) {
    a.re.lastIndex = 0;
    const m = a.re.exec(text);
    if (m && (earliest === -1 || m.index < earliest)) earliest = m.index;
  }
  return earliest;
}

// نوع مبسّط للحدث المنظّم القادم من Mistral (نسخة محليّة لتفادي الاعتماد الدائريّ).
export type StructuredEventInput = {
  decision_number?: string | null;
  decision_date?: string | null;
  parent_reference?: string | null;
  event_type?: string | null;
};

// يبحث عن التاريخ المنظّم المطابق لرقم القرار، ويعيده مطبَّعًا.
function structuredDateFor(
  ownNumber: string | null,
  structured: StructuredEventInput[] | undefined
): string | null {
  if (!ownNumber || !structured || !structured.length) return null;
  const target = toAsciiDigits(ownNumber).replace(/\D/g, "");
  if (!target) return null;
  for (const s of structured) {
    if (!s.decision_number) continue;
    const sn = toAsciiDigits(String(s.decision_number)).replace(/\D/g, "");
    if (sn && sn === target && s.decision_date) {
      const norm = normalizeHijriDate(String(s.decision_date));
      if (norm) return norm;
    }
  }
  return null;
}

export function parseIssue(fullText: string, structured?: StructuredEventInput[]): ParseResult {
  const start = findRegulatoryStart(fullText);
  if (start === -1) return { regulatory_section_found: false, events: [] };
  const region = fullText.slice(start);

  type Hit = { index: number; type: string };
  const hits: Hit[] = [];
  for (const a of ANCHORS) {
    a.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = a.re.exec(region)) !== null) hits.push({ index: m.index, type: a.type });
  }
  if (!hits.length) return { regulatory_section_found: false, events: [] };
  hits.sort((x, y) => x.index - y.index);
  const dedup: Hit[] = [];
  for (const h of hits) {
    const prev = dedup[dedup.length - 1];
    if (prev && h.index - prev.index < 25) continue;
    dedup.push(h);
  }

  const events: ParsedEvent[] = [];
  for (let i = 0; i < dedup.length; i++) {
    const segStart = dedup[i].index;
    const segEnd = i + 1 < dedup.length ? dedup[i + 1].index : region.length;
    const raw = region.slice(segStart, segEnd).trim();
    if (raw.length < 80) continue;

    const header = raw.slice(0, 200);
    const parentRef = extractParentReference(raw);
    const { title: parentTitle, kind } = extractParentTitle(raw);
    const ownNumber = extractOwnNumber(header);
    // التاريخ: نفضّل المنظّم (من الرؤية البصريّة، دقيق الترتيب) ثمّ نسقط لتطبيع تاريخ النصّ.
    const structuredDate = structuredDateFor(ownNumber, structured);
    const dateH = structuredDate ?? normalizeHijriDate(extractHijriDate(raw));
    const clean = isCleanTitle(parentTitle);

    const matchKeys: string[] = [];
    if (parentRef) matchKeys.push(parentRef);
    if (clean && parentTitle) matchKeys.push(parentTitle.replace(/\s+/g, " ").trim());

    events.push({
      event_type: refineEventType(dedup[i].type, raw),
      instrument_number: ownNumber,
      authority: extractAuthority(header, raw),
      event_date_hijri: dateH,
      event_sort: hijriToSort(dateH),
      affected_articles: extractAffectedArticles(raw),
      raw_text: raw,
      parent_reference: parentRef,
      parent_title: clean ? parentTitle : null,
      instrument_kind: kind,
      match_keys: matchKeys,
      title_is_clean: clean,
    });
  }
  return { regulatory_section_found: true, events };
}
