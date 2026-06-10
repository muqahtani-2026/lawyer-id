import { createClient } from "@/lib/supabase/server";

export type Tier = "free" | "pro";

/**
 * يقرأ طبقة اشتراك المستخدم الحاليّ من profiles.tier.
 * يعتمد على عميل الخادم (سياق المستخدم) — RLS تسمح للمستخدم بقراءة صفّه.
 *
 * ⚠️ مسار الاستيراد @/lib/supabase/server هو الافتراضيّ في مشاريع @supabase/ssr.
 *    إن كان مُنشئ عميل الخادم لديك في مسار/اسم مختلف، عدّل السطر أعلاه.
 *    التوقيع المفترَض:  const supabase = await createClient()
 */
export async function getUserTier(): Promise<Tier> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "free";

  const { data, error } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (error || !data) return "free";
  return data.tier === "pro" ? "pro" : "free";
}

export async function isPro(): Promise<boolean> {
  return (await getUserTier()) === "pro";
}
