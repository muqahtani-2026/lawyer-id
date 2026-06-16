import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processNextBatch } from "@/lib/gazette/import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    return !!data?.is_admin;
  } catch {
    return false;
  }
}

/**
 * يعالج الدفعة التالية من أعداد أم القرى (استخلاص حرفيّ + تحليل + ربط).
 * الصلاحية: جلسة مشرف، أو CRON_SECRET للأتمتة.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const cronOk = secret && auth === `Bearer ${secret}`;
  const adminOk = await isAdmin();
  if (!cronOk && !adminOk) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { limit?: number; reprocess?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* لا جسم */
  }

  try {
    const result = await processNextBatch({ limit: body.limit ?? 3, reprocess: body.reprocess });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
