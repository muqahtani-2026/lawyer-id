import { supabaseAdmin } from "@/lib/supabase/admin";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const BUCKET = "gazette-pdfs";

// مفتاح Mistral OCR — يُقرأ من متغيّرات بيئة Vercel (لا يُكتب في الكود أبدًا).
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_OCR_URL = "https://api.mistral.ai/v1/ocr";
const MISTRAL_OCR_MODEL = "mistral-ocr-latest";

// الاستخراج المنظّم للتواريخ/المراجع (ب-2) — مفعّل افتراضيًّا للدقّة القصوى.
// يمكن إطفاؤه بوضع GAZETTE_STRUCTURED=false إن لزم.
const USE_STRUCTURED = process.env.GAZETTE_STRUCTURED !== "false";

// حدث منظّم كما يقرؤه Mistral بصريًّا (التاريخ بترتيبه الصحيح من الصورة).
export type StructuredEvent = {
  decision_number?: string | null;   // رقم القرار/المرسوم
  decision_date?: string | null;     // التاريخ كما يظهر بصريًّا (سنة/شهر/يوم)
  parent_reference?: string | null;  // مرجع م/NN إن وُجد
  event_type?: string | null;        // إصدار/تعديل/إلغاء/قرار مجلس وزراء...
};

export type ExtractResult = {
  ok: boolean;
  text?: string;
  charCount?: number;
  arabicRatio?: number;
  error?: string;
  needsOcr?: boolean;
  method?: string;
  structuredEvents?: StructuredEvent[]; // أحداث منظّمة لتصحيح التواريخ في parse.ts
};

// مخطّط JSON للاستخراج المنظّم — يطلب من Mistral قائمة الأحداث النظاميّة بحقول دقيقة.
const DOC_ANNOTATION_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "regulatory_events",
    strict: false,
    schema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          description:
            "كلّ قرار/مرسوم/قرار مجلس وزراء/قرار وزاريّ نظاميّ في الوثيقة. تجاهل الأخبار والإعلانات والجداول العقاريّة.",
          items: {
            type: "object",
            properties: {
              decision_number: {
                type: "string",
                description: "رقم القرار أو المرسوم نفسه (الأرقام كما تظهر بصريًّا).",
              },
              decision_date: {
                type: "string",
                description:
                  "تاريخ القرار كما يظهر بصريًّا في الصفحة، بترتيب سنة/شهر/يوم (مثل 1446/4/12). انسخ الأرقام كما تراها دون قلب.",
              },
              parent_reference: {
                type: "string",
                description: "رقم المرسوم الملكيّ الأمّ إن أُشير إليه، بصيغة م/NN (مثل م/91). وإلّا اتركه فارغًا.",
              },
              event_type: {
                type: "string",
                description: "نوع الحدث: royal_decree أو cabinet_decision أو ministerial_decision أو issued أو amended أو repealed.",
              },
            },
          },
        },
      },
    },
  },
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
async function mistralOcr(fileName: string): Promise<{ text: string; structuredEvents: StructuredEvent[] }> {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY غير مضبوط في البيئة.");

  const documentUrl = publicPdfUrl(fileName);

  const body: Record<string, unknown> = {
    model: MISTRAL_OCR_MODEL,
    document: { type: "document_url", document_url: documentUrl },
    include_image_base64: false,
  };

  // الاستخراج المنظّم (ب-2): نطلب التواريخ والمراجع بحقول دقيقة من الرؤية البصريّة.
  if (USE_STRUCTURED) {
    body.document_annotation_format = DOC_ANNOTATION_SCHEMA;
    body.document_annotation_prompt =
      "استخرج كلّ قرار أو مرسوم أو قرار مجلس وزراء نظاميّ. لكلّ واحد: رقمه وتاريخه (سنة/شهر/يوم كما يظهر بصريًّا دون قلب الأرقام) ومرجعه الأمّ م/NN إن وُجد ونوعه. تجاهل الأخبار والجداول العقاريّة.";
  }

  const res = await fetch(MISTRAL_OCR_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Mistral OCR HTTP ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const json = await res.json();
  const pages: Array<{ markdown?: string }> = json?.pages ?? [];
  if (!pages.length) throw new Error("Mistral OCR: لا صفحات في الردّ.");

  // دمج النصّ بالترتيب.
  const text = pages.map((p) => p.markdown ?? "").join("\n\n");

  // استخراج الأحداث المنظّمة من document_annotation (قد تأتي كنصّ JSON).
  let structuredEvents: StructuredEvent[] = [];
  const ann = json?.document_annotation;
  if (ann) {
    try {
      const parsed = typeof ann === "string" ? JSON.parse(ann) : ann;
      if (Array.isArray(parsed?.events)) structuredEvents = parsed.events;
    } catch {
      /* تجاهل فشل التحليل — نكتفي بالنصّ */
    }
  }

  return { text, structuredEvents };
}

/**
 * يستخرج النصّ الكامل من PDF عبر Mistral OCR.
 * (إعادة استخلاص نظيف يصحّح فشل طبقة النصّ المعطوبة — ليس تعديلًا يدويًّا للنصّ الحرفيّ.)
 */
export async function extractGazetteText(fileName: string): Promise<ExtractResult> {
  try {
    // التحقّق من وجود الملفّ في المخزن (downloadPdf يرمي إن غاب).
    await downloadPdf(fileName);

    // OCR للنصّ النظيف + الاستخراج المنظّم للتواريخ/المراجع (ب-2).
    const { text, structuredEvents } = await mistralOcr(fileName);
    const method = USE_STRUCTURED ? "mistral_ocr+structured" : "mistral_ocr";

    const charCount = text.length;
    const ratio = arabicRatio(text);

    // مع OCR، التشويه يجب أن يختفي تقريبًا. إن بقيت الجودة منخفضة جدًّا → علم للمراجعة.
    const needsOcr = charCount < 200 || ratio < 0.2;

    return { ok: true, text, charCount, arabicRatio: ratio, needsOcr, method, structuredEvents };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "extract error" };
  }
}
