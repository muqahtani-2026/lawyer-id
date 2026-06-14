import { createClient } from "@/lib/supabase/server";

export type Tier = "free" | "pro" | "premium";

const TIERS: Tier[] = ["free", "pro", "premium"];

function normalizeTier(value: unknown): Tier {
  return TIERS.includes(value as Tier) ? (value as Tier) : "free";
}

/**
 * يقرأ طبقة اشتراك المستخدم الحاليّ من profiles.tier.
 * يعتمد على عميل الخادم (سياق المستخدم) — RLS تسمح للمستخدم بقراءة صفّه.
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
  return normalizeTier(data.tier);
}

/** Pro أو أعلى (Premium يتضمّن مزايا Pro). */
export async function isPro(): Promise<boolean> {
  const tier = await getUserTier();
  return tier === "pro" || tier === "premium";
}

/** Premium فقط. */
export async function isPremium(): Promise<boolean> {
  return (await getUserTier()) === "premium";
}

/** ترتيب الطبقات للمقارنة (free < pro < premium). */
export function tierRank(tier: Tier): number {
  return TIERS.indexOf(tier);
}

/** هل يملك المستخدم الطبقة المطلوبة أو أعلى؟ */
export function meetsTier(current: Tier, required: Tier): boolean {
  return tierRank(current) >= tierRank(required);
}
