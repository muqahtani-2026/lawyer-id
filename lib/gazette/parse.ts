// ============================================================
// محلّل جريدة أم القرى — يفصل القرارات/المراسيم/اللوائح عن الأخبار
// محافظ ودقيق: لا يخترع أنظمة من عناوين مشوّهة. raw_text حرفيّ.
// ============================================================

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function toAsciiDigits(s: string): string {
  return s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}
const D = "[٠-٩0-9]";

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

export function parseIssue(fullText: string): ParseResult {
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
    const dateH = extractHijriDate(raw);
    const clean = isCleanTitle(parentTitle);

    const matchKeys: string[] = [];
    if (parentRef) matchKeys.push(parentRef);
    if (clean && parentTitle) matchKeys.push(parentTitle.replace(/\s+/g, " ").trim());

    events.push({
      event_type: refineEventType(dedup[i].type, raw),
      instrument_number: extractOwnNumber(header),
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
