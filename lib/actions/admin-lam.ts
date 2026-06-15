"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface Res {
  ok: boolean;
  error?: string;
}

/** يتحقّق أنّ المستخدم الحاليّ مشرف قبل أيّ عمليّة بصلاحيّة الخدمة. */
async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return !!data?.is_admin;
}

const DENIED: Res = { ok: false, error: "غير مصرّح" };

/* ------------------------------ المقالات ------------------------------ */
export async function moderateArticle(
  id: string,
  action: "publish" | "reject" | "unpublish"
): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (action === "publish") {
    patch.status = "published";
    patch.published_at = new Date().toISOString();
  } else if (action === "reject") {
    patch.status = "rejected";
  } else {
    patch.status = "unpublished";
  }
  const { error } = await supabaseAdmin.from("articles").update(patch).eq("id", id);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath("/admin/articles");
  revalidatePath("/articles");
  return { ok: true };
}

/* ------------------------------ الأسئلة ------------------------------- */
export async function moderateQuestion(
  id: string,
  action: "approve" | "reject" | "publish"
): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "published";
  const { error } = await supabaseAdmin
    .from("questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath("/admin/questions");
  revalidatePath("/ask");
  return { ok: true };
}

/* ------------------------------ الأجوبة ------------------------------- */
export async function moderateAnswer(
  id: string,
  action: "approve" | "publish" | "reject"
): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;

  if (action === "publish") {
    const { data: ans } = await supabaseAdmin
      .from("answers")
      .select("question_id")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("answers")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { ok: false, error: "تعذّر النشر." };
    if (ans?.question_id) {
      await supabaseAdmin
        .from("questions")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", ans.question_id);
    }
  } else {
    const status = action === "approve" ? "approved" : "rejected";
    const { error } = await supabaseAdmin.from("answers").update({ status }).eq("id", id);
    if (error) return { ok: false, error: "تعذّر التحديث." };
  }
  revalidatePath("/admin/questions");
  revalidatePath("/ask");
  return { ok: true };
}

/* ----------------------------- التصنيفات ----------------------------- */
export async function upsertField(input: {
  id?: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  domain?: string;
}): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  if (!input.name_ar?.trim() || !input.slug?.trim())
    return { ok: false, error: "الاسم والمعرّف مطلوبان." };

  const row = {
    name_ar: input.name_ar.trim(),
    name_en: input.name_en?.trim() || null,
    slug: input.slug.trim(),
    description: input.description?.trim() || null,
    is_active: input.is_active ?? true,
    domain: input.domain?.trim() || "legal",
  };

  const res = input.id
    ? await supabaseAdmin.from("specialties").update(row).eq("id", input.id)
    : await supabaseAdmin.from("specialties").insert(row);
  if (res.error) return { ok: false, error: "تعذّر الحفظ (قد يكون المعرّف مكرّرًا)." };
  revalidatePath("/admin/taxonomy");
  return { ok: true };
}

export async function toggleField(id: string, isActive: boolean): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  const { error } = await supabaseAdmin
    .from("specialties")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath("/admin/taxonomy");
  return { ok: true };
}

/* --------------------------- إدارة المهنيّ (Admin) --------------------------- */

/** تفعيل/تعطيل ظهور المهنيّ في الموقع العام. */
export async function adminSetProfessionalPublic(userId: string, isPublic: boolean): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath(`/admin/lawyers/${userId}`);
  revalidatePath("/admin/lawyers");
  return { ok: true };
}

/** تغيير مستوى اشتراك المهنيّ (تجاوز إداريّ). */
export async function adminSetProfessionalTier(userId: string, tier: "free" | "pro" | "premium"): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  if (!["free", "pro", "premium"].includes(tier)) return { ok: false, error: "مستوى غير صالح." };
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ tier, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: "تعذّر التحديث." };
  revalidatePath(`/admin/lawyers/${userId}`);
  revalidatePath("/admin/lawyers");
  return { ok: true };
}

/* --------------------------- اعتماد المهنيّين --------------------------- */
export async function adminApproveProfessional(userId: string): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ approval_status: "approved", approval_note: null, reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: "تعذّر الاعتماد." };
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/lawyers");
  return { ok: true };
}

export async function adminRejectProfessional(userId: string, note: string): Promise<Res> {
  if (!(await requireAdmin())) return DENIED;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ approval_status: "rejected", is_public: false, approval_note: note?.trim() || "غير مطابق", reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { ok: false, error: "تعذّر الرفض." };
  revalidatePath("/admin/approvals");
  return { ok: true };
}

/** يولّد رابطًا موقّعًا لوثيقة الاعتماد (يُستدعى من الواجهة عند الضغط على "عرض الوثيقة"). */
export async function adminCredentialUrl(path: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "غير مصرّح" };
  const { data } = await supabaseAdmin.storage.from("credentials").createSignedUrl(path, 300);
  if (!data?.signedUrl) return { ok: false, error: "تعذّر إنشاء الرابط." };
  return { ok: true, url: data.signedUrl };
}
