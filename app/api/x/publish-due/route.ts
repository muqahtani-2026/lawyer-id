import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { publishDraftForUser } from "@/lib/x-core";

/**
 * POST /api/x/publish-due
 * ينشر كلّ المسوّدات المجدوَلة التي حان وقتها.
 * محميّ بسرّ: Authorization: Bearer ${CRON_SECRET}
 * يُستدعى من n8n (Schedule trigger كلّ 5 دقائق).
 *
 * منطق الفشل:
 * - فشل دائم (نصّ طويل، لا ربط، ليست pro...) → تُمسح الجدولة كي لا يتكرّر عبثًا.
 * - فشل مؤقّت (402 رصيد، 429، 5xx، شبكة) → تبقى الجدولة وتُعاد المحاولة في الدورة التالية.
 */

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 10;

export async function POST(req: NextRequest) {
  // 1) حماية بالسرّ
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET غير مضبوط على الخادم." }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) جلب المستحقّ
  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabaseAdmin
    .from("content_drafts")
    .select("id, user_id, scheduled_for")
    .not("scheduled_for", "is", null)
    .is("published_at", null)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("publish-due query failed:", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ checked_at: nowIso, due: 0, results: [] });
  }

  // 3) النشر واحدة واحدة
  const results: Array<{
    draft_id: string;
    ok: boolean;
    tweet_id?: string;
    error?: string;
    cleared?: boolean;
  }> = [];

  for (const d of due) {
    const r = await publishDraftForUser(d.user_id, d.id);
    if (r.ok) {
      results.push({ draft_id: d.id, ok: true, tweet_id: r.tweetId });
    } else {
      let cleared = false;
      if (r.permanent) {
        // فشل دائم: امسح الجدولة كي لا تتكرّر المحاولة بلا جدوى
        await supabaseAdmin
          .from("content_drafts")
          .update({ scheduled_for: null })
          .eq("id", d.id);
        cleared = true;
      }
      results.push({ draft_id: d.id, ok: false, error: r.error, cleared });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({
    checked_at: nowIso,
    due: due.length,
    published: okCount,
    failed: due.length - okCount,
    results,
  });
}
