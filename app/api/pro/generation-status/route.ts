import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/pro/generation-status
 * يعدّ المسوّدات الجديدة المُولَّدة بعد لحظة قبول الدفع (بداية الاشتراك النشط).
 * تُستهلَك من واجهة العدّاد في /upgrade/success.
 * يقرأ مسوّدات صاحب الجلسة فقط (RLS + فلترة بالـ user_id).
 */

export const dynamic = "force-dynamic";

const TARGET = 30;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // لحظة قبول الدفع = بداية الاشتراك النشط الحاليّ.
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("current_period_start, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("current_period_start", { ascending: false })
    .maybeSingle();

  // إن لم يوجد اشتراك نشط بعد، لا عدّ.
  const since = sub?.current_period_start ?? null;
  if (!since) {
    return NextResponse.json({ count: 0, target: TARGET, done: false, since: null });
  }

  // عدّ المسوّدات المُولَّدة بعد لحظة الاشتراك.
  const { count, error } = await supabase
    .from("content_drafts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("generated_at", since);

  if (error) {
    return NextResponse.json({ error: "count_failed" }, { status: 500 });
  }

  const n = count ?? 0;
  return NextResponse.json({
    count: Math.min(n, TARGET),
    target: TARGET,
    done: n >= TARGET,
    since,
  });
}
