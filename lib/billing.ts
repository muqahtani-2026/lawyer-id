import { createClient } from "@supabase/supabase-js";
import { retrieveCharge } from "@/lib/tap";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE ?? "";
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * يطلب من n8n توليد دفعة (30) مسوّدة للمحامي بعد ترقيته إلى Pro.
 * غير قاتل: أيّ فشل لا يؤثّر على تفعيل الاشتراك (المحامي يبقى Pro، والتوليد
 * يمكن إعادة تشغيله يدويًّا). يُفعَّل فقط إن ضُبط N8N_GENERATE_WEBHOOK_URL.
 */
async function triggerProBatchGeneration(userId: string): Promise<void> {
  const hook = process.env.N8N_GENERATE_WEBHOOK_URL;
  if (!hook) return; // لم يُضبط بعد — تخطٍّ صامت.
  try {
    await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({ user_id: userId, count: 30, reason: "pro_upgrade" }),
    });
  } catch (err) {
    console.error("pro batch generation trigger failed (non-fatal):", err);
  }
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

  // هل كان المستخدم Pro مسبقًا؟ (لتفادي إعادة توليد 30 عند تجديد/تكرار الـ webhook)
  const { data: before } = await db
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();
  const wasPro = before?.tier === "pro";

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

  // ترقية جديدة فقط → ولّد 30 مسوّدة. (لا نكرّرها عند التجديد.)
  if (!wasPro) {
    await triggerProBatchGeneration(userId);
  }

  return { ok: true };
}
