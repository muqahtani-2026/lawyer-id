import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** نقطة جلب الأنظمة — يستدعيها Vercel Cron يوميًّا (محميّة بـ CRON_SECRET). */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret");
  const authorized = secret && (auth === `Bearer ${secret}` || provided === secret);
  if (!authorized) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runIngestion();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
