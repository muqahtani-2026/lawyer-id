// lib/extract.ts
// استخلاص النصّ من ملفّات PDF و DOCX. يعمل في بيئة Node (Server Actions) — لا Edge.
import mammoth from "mammoth";

export type ExtractResult = {
  text: string;
  fileType: "pdf" | "docx";
};

const MAX_CHARS = 200_000; // حدّ أمان لطول النصّ المخزَّن

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CHARS);
}

/**
 * يستخلص النصّ من Buffer لملفّ PDF أو DOCX.
 * يرمي خطأً واضحًا إن كانت الصيغة غير مدعومة أو تعذّر الاستخلاص.
 */
export async function extractText(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ExtractResult> {
  const lower = fileName.toLowerCase();
  const isPdf = mimeType === "application/pdf" || lower.endsWith(".pdf");
  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx");

  if (isPdf) {
    // استيراد من المسار الداخليّ لتفادي قراءة ملفّ الاختبار في بعض إصدارات pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    const text = normalize(data.text || "");
    if (!text) throw new Error("تعذّر استخلاص نصّ من ملفّ PDF (قد يكون صورة ممسوحة).");
    return { text, fileType: "pdf" };
  }

  if (isDocx) {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = normalize(value || "");
    if (!text) throw new Error("تعذّر استخلاص نصّ من ملفّ DOCX.");
    return { text, fileType: "docx" };
  }

  throw new Error("صيغة غير مدعومة: يُقبل PDF أو DOCX فقط.");
}
