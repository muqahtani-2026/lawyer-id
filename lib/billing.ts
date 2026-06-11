import { createClient } from "@supabase/supabase-js";
import { retrieveCharge } from "@/lib/tap";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function activateProFromCharge(
  chargeId: string
): Promise<{ ok: boolean; status?: string; error?: string }> {
  const charge = await retrieveCharge(chargeId);

  if (charge.status !== "CAPTURED") {
    return { ok: false, status: charge.status };
  }

  const userId = charge.metadata?.user_id;
  if (!userId) {
    return { ok: false, error: "missing user_id in charge metadata" };
  }

  const db = serviceClient();
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { error: subErr } = await db.from("subscriptions").upsert(
    {
      user_id: userId,
      tier: "pro",
      status: "active",
      provider: "tap",
      provider_subscription_id: charge.id,
      provider_customer_id: charge.customer?.id ?? null,
      amount: charge.amount,
      currency: charge.currency,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      canceled_at: null,
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (subErr) return { ok: false, error: subErr.message };

  const { error: tierErr } = await db
    .from("profiles")
    .update({ tier: "pro" })
    .eq("id", userId);
  if (tierErr) return { ok: false, error: tierErr.message };

  return { ok: true };
}
