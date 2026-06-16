import { supabaseAdmin } from "@/lib/supabase/admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "gazette-pdfs";

export type ExtractResult = {
  ok: boolean;
  text?: string;
  charCount?: number;
  arabicRatio?: number;
  error?: string;
  needsOcr?: boolean;
};

/**
 * يبني الرابط العامّ لملفّ في مخزن أم القرى.
 */
export function publicPdfUrl(fileName: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
}

/**
 * ينزّل ملفّ PDF من المخزن (الخادم يصل إلى Supabase، بخلاف بيئة المحادثة).
 */
async function downloadPdf(fileName: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(fileName);
  if (error || !data) throw new Error(`download failed: ${error?.message ?? "no data"}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * نسبة الأحرف العربيّة في النصّ — مؤشّر على جودة الاستخلاص.
 * نصّ سليم من جريدة عربيّة يجب أن تكون نسبته العربيّة مرتفعة.
 */
function arabicRatio(text: string): number {
  if (!text || text.length === 0) return 0;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const replacement = (text.match(/\uFFFD/g) || []).length; // � مؤشّر تشويه
  const meaningful = text.replace(/\s/g, "").length || 1;
  // نخصم التشويه
  return (arabic - replacement) / meaningful;
}

/**
 * يستخرج النصّ الكامل حرفيًّا من PDF عبر pdf-parse (pdfjs).
 * لا يُعدّل النصّ — يُعيده كما هو من طبقة النصّ في الملفّ.
 */
export async function extractGazetteText(fileName: string): Promise<ExtractResult> {
  try {
    const buf = await downloadPdf(fileName);

    // pdf-parse: استخلاص طبقة النصّ كما هي
    // نستورد ملفّ المكتبة مباشرةً لتجنّب كود الاختبار في index.js (يكسر البناء المُجمّع)
    // @ts-expect-error — لا توجد أنواع للمسار الداخليّ
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const parsed = await pdfParse(buf);
    const text = parsed.text ?? "";
    const charCount = text.length;
    const ratio = arabicRatio(text);

    // إن كان النصّ ضئيلًا جدًّا أو نسبته العربيّة منخفضة → غالبًا PDF صورة (يحتاج OCR)
    const needsOcr = charCount < 200 || ratio < 0.2;

    return { ok: true, text, charCount, arabicRatio: ratio, needsOcr };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "extract error" };
  }
}
