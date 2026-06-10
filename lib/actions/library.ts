"use server";

// lib/actions/library.ts
// أفعال الخادم لمكتبة المحامي الشخصيّة (Pro — Phase 8.4/8.5).
// ⚠️ عدّل سطر استيراد عميل Supabase أدناه ليطابق الـ helper المستخدم في feedback.ts
//    (نفس عميل الخادم المعتمد على جلسة المستخدم، لتُطبَّق RLS وسياسات Storage لكلّ محامٍ).
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { extractText } from "@/lib/extract";

const BUCKET = "lawyer-documents";
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

export type CorpusItem = {
  id: string;
  user_id: string;
  title: string;
  document_type: string | null;
  full_text: string | null;
  summary: string | null;
  specialty_id: string | null;
  tags: string[] | null;
  file_path: string | null;
  file_name: string | null;
  file_type: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** قائمة مكتبة المحامي (RLS تكفل أنه يرى مكتبته فقط) */
export async function listMyCorpus(): Promise<ActionResult<CorpusItem[]>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "غير مُصرّح." };
  const { data, error } = await supabase
    .from("user_legal_corpus")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as CorpusItem[] };
}

/** رفع ملفّ (PDF/DOCX) + استخلاص النصّ + إنشاء صفّ في المكتبة */
export async function uploadCorpusItem(
  formData: FormData
): Promise<ActionResult<CorpusItem>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "غير مُصرّح." };

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") ?? "").trim();
  const documentType = String(formData.get("document_type") ?? "مستند").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const tags = tagsRaw
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : null;

  if (!file) return { ok: false, error: "لم يُرفق ملفّ." };
  if (!title) return { ok: false, error: "العنوان مطلوب." };
  if (file.size > MAX_FILE_BYTES)
    return { ok: false, error: "حجم الملفّ يتجاوز 15MB." };

  const bytes = Buffer.from(await file.arrayBuffer());

  // 1) استخلاص النصّ أوّلًا (قبل الرفع، لتفادي رفع ملفّ لا يُستخلَص منه شيء)
  let extracted;
  try {
    extracted = await extractText(bytes, file.name, file.type);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "تعذّر استخلاص النصّ.",
    };
  }

  // 2) رفع الملفّ إلى Storage داخل مجلّد المستخدم {user_id}/... (سياسة التخزين تتحقّق من ذلك)
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) return { ok: false, error: `فشل الرفع: ${upErr.message}` };

  // 3) إدراج الصفّ (RLS: user_id = auth.uid())
  const { data, error } = await supabase
    .from("user_legal_corpus")
    .insert({
      user_id: user.id,
      title,
      document_type: documentType || "مستند",
      full_text: extracted.text,
      tags,
      file_path: path,
      file_name: file.name,
      file_type: extracted.fileType,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    // تنظيف الملفّ المرفوع إن فشل الإدراج (تفادي ملفّات يتيمة)
    await supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: error.message };
  }

  revalidatePath("/library");
  return { ok: true, data: data as CorpusItem };
}

/** إضافة مستند نصّيّ يدويّ (لصق نصّ دون ملفّ) */
export async function addTextCorpusItem(input: {
  title: string;
  full_text: string;
  document_type?: string;
  tags?: string[];
}): Promise<ActionResult<CorpusItem>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "غير مُصرّح." };
  const title = input.title?.trim();
  const full_text = input.full_text?.trim();
  if (!title) return { ok: false, error: "العنوان مطلوب." };
  if (!full_text) return { ok: false, error: "النصّ مطلوب." };

  const { data, error } = await supabase
    .from("user_legal_corpus")
    .insert({
      user_id: user.id,
      title,
      document_type: input.document_type?.trim() || "مستند",
      full_text: full_text.slice(0, 200_000),
      tags: input.tags?.length ? input.tags : null,
      is_active: true,
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true, data: data as CorpusItem };
}

/** تحديث البيانات الوصفيّة (العنوان/النوع/الملخّص/الوسوم/التفعيل) */
export async function updateCorpusItem(
  id: string,
  patch: Partial<
    Pick<CorpusItem, "title" | "document_type" | "summary" | "tags" | "is_active">
  >
): Promise<ActionResult<CorpusItem>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "غير مُصرّح." };
  const { data, error } = await supabase
    .from("user_legal_corpus")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/library");
  return { ok: true, data: data as CorpusItem };
}

/** حذف الصفّ + ملفّ Storage المرتبط به */
export async function deleteCorpusItem(id: string): Promise<ActionResult<null>> {
  const { supabase, user } = await getUser();
  if (!user) return { ok: false, error: "غير مُصرّح." };

  const { data: row, error: selErr } = await supabase
    .from("user_legal_corpus")
    .select("file_path")
    .eq("id", id)
    .single();
  if (selErr) return { ok: false, error: selErr.message };

  const { error: delErr } = await supabase
    .from("user_legal_corpus")
    .delete()
    .eq("id", id);
  if (delErr) return { ok: false, error: delErr.message };

  if (row?.file_path) {
    await supabase.storage.from(BUCKET).remove([row.file_path]);
  }
  revalidatePath("/library");
  return { ok: true, data: null };
}
