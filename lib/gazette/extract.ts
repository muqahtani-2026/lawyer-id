import { supabaseAdmin } from "@/lib/supabase/admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "gazette-pdfs";

// مفتاح Mistral OCR — يُقرأ من متغيّرات بيئة Vercel (لا يُكتب في الكود أبدًا).
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_OCR_URL = "https://api.mistral.ai/v1/ocr";
const MISTRAL_OCR_MODEL = "mistral-ocr-latest";

// علم تفعيل دمج الأرقام من طبقة النصّ الأصليّة (الخيار ب).
// نبدأ بـ false لاختبار OCR صرفًا أوّلًا (عزل المتغيّرات)، ثمّ نفعّله بعد التحقّق.
const MERGE_NATIVE_NUMERALS = process.env.GAZETTE_MERGE_NUMERALS === "true";

export type ExtractResult = {
  ok: boolean;
  text?: string;
  charCount?: number;
  arabicRatio?: number;
  error?: string;
  needsOcr?: boolean;
  method?: string; // "mistral_ocr" | "mistral_ocr+native_numerals"
};

/**
 * يبني الرابط العامّ لملفّ في مخزن أم القرى.
 */
export function publicPdfUrl(fileName: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;
}

/**
 * ينزّل ملفّ PDF من المخزن (الخادم يصل إلى Supabase).
 */
async function downloadPdf(fileName: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(fileName);
  if (error || !data) throw new Error(`download failed: ${error?.message ?? "no data"}`);
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * نسبة الأحرف العربيّة في النصّ — مؤشّر على جودة الاستخلاص.
 */
function arabicRatio(text: string): number {
  if (!text || text.length === 0) return 0;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const replacement = (text.match(/\uFFFD/g) || []).length; // � مؤشّر تشويه
  const meaningful = text.replace(/\s/g, "").length || 1;
  return (arabic - replacement) / meaningful;
}

/**
 * استخلاص نصّ OCR من Mistral عبر الرابط العامّ للملفّ.
 * يُعيد النصّ النظيف (دمج markdown لكلّ الصفحات بالترتيب).
 */
async function mistralOcr(fileName: string): Promise<string> {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY غير مضبوط في البيئة.");

  const documentUrl = publicPdfUrl(fileName);

  const res = await fetch(MISTRAL_OCR_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MISTRAL_OCR_MODEL,
      document: { type: "document_url", document_url: documentUrl },
      include_image_base64: false,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Mistral OCR HTTP ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const json = await res.json();
  const pages: Array<{ markdown?: string }> = json?.pages ?? [];
  if (!pages.length) throw new Error("Mistral OCR: لا صفحات في الردّ.");

  // دمج النصّ بالترتيب، فاصل صفحات واضح.
  const text = pages.map((p) => p.markdown ?? "").join("\n\n");
  return text;
}

/**
 * يستخرج النصّ الكامل من PDF عبر Mistral OCR.
 * (إعادة استخلاص نظيف يصحّح فشل طبقة النصّ المعطوبة — ليس تعديلًا يدويًّا للنصّ الحرفيّ.)
 */
export async function extractGazetteText(fileName: string): Promise<ExtractResult> {
  try {
    // التحقّق من وجود الملفّ في المخزن (downloadPdf يرمي إن غاب).
    await downloadPdf(fileName);

    // الطبقة 1: OCR للنصّ العربيّ النظيف.
    const ocrText = await mistralOcr(fileName);
    let text = ocrText;
    let method = "mistral_ocr";

    // الطبقة 2 (الخيار ب): دمج الأرقام/التواريخ من طبقة النصّ الأصليّة — تُفعَّل بعد التحقّق.
    // (تُبنى في الخطوة التالية بعد نجاح OCR الصرف؛ العلم يبقى false الآن.)
    if (MERGE_NATIVE_NUMERALS) {
      method = "mistral_ocr+native_numerals";
      // سيُضاف منطق الدمج هنا في المرحلة التالية.
    }

    const charCount = text.length;
    const ratio = arabicRatio(text);

    // مع OCR، التشويه يجب أن يختفي تقريبًا. إن بقيت الجودة منخفضة جدًّا → علم للمراجعة.
    const needsOcr = charCount < 200 || ratio < 0.2;

    return { ok: true, text, charCount, arabicRatio: ratio, needsOcr, method };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "extract error" };
  }
}
