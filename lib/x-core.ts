import { supabaseAdmin } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * نواة النشر على X بصلاحيّة service_role — بلا جلسة مستخدم.
 * تُستخدم من /api/x/publish-due (محرّك الجدولة عبر n8n).
 *
 * ملاحظة: lib/actions/x-publish.ts (زرّ النشر الفوريّ) يبقى كما هو —
 * هذه نسخة مستقلّة للتشغيل الآليّ، كي لا نلمس مسارًا مُختبَرًا يعمل.
 */

const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_TWEET_URL = "https://api.x.com/2/tweets";
const TWEET_MAX = 280;
const REFRESH_BUFFER_MS = 60 * 1000;

export type CorePublishResult =
  | { ok: true; tweetId: string }
  | { ok: false; error: string; permanent?: boolean };

/**
 * ينشر مسوّدة محامٍ على X (للاستخدام الآليّ).
 * يتحقّق: tier=pro، المسوّدة ملك المحامي، x_short، مقبولة، غير منشورة.
 * عند النجاح: يضبط published_at ويمسح scheduled_for.
 * permanent=true تعني أنّ إعادة المحاولة بلا جدوى (نصّ طويل/لا ربط) — تُمسح الجدولة.
 */
export async function publishDraftForUser(
  userId: string,
  draftId: string,
): Promise<CorePublishResult> {
  const admin = supabaseAdmin;

  // 1) gating: المحامي pro
  const { data: profile } = await admin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single();
  if (profile?.tier !== "pro") {
    return { ok: false, error: "المحامي ليس على طبقة Pro.", permanent: true };
  }

  // 2) المسوّدة: ملكه + صالحة للنشر
  const { data: draft } = await admin
    .from("content_drafts")
    .select("user_id, draft_content, content_format, status, published_at")
    .eq("id", draftId)
    .single();
  if (!draft || draft.user_id !== userId) {
    return { ok: false, error: "المسوّدة غير موجودة أو ليست لهذا المحامي.", permanent: true };
  }
  if (draft.published_at) {
    return { ok: false, error: "المسوّدة منشورة مسبقًا.", permanent: true };
  }
  if (draft.status !== "approved") {
    return { ok: false, error: "المسوّدة غير مقبولة.", permanent: true };
  }
  if (draft.content_format !== "x_short") {
    return { ok: false, error: "صيغة المسوّدة ليست x_short.", permanent: true };
  }

  const text = (draft.draft_content ?? "").trim();
  if (!text) return { ok: false, error: "المسوّدة فارغة.", permanent: true };
  if (text.length > TWEET_MAX) {
    return { ok: false, error: `النصّ ${text.length} محرفًا > ${TWEET_MAX}.`, permanent: true };
  }

  // 3) توكن صالح
  let accessToken: string;
  try {
    accessToken = await getValidAccessTokenAdmin(userId);
  } catch (e) {
    // فشل التوكن قد يكون مؤقّتًا (شبكة) أو دائمًا (لا ربط) — نعتبره دائمًا فقط إن كان "لا ربط"
    const msg = e instanceof Error ? e.message : "فشل تجهيز التوكن.";
    const permanent = msg.includes("لم يُربَط");
    return { ok: false, error: msg, permanent };
  }

  // 4) النشر
  const res = await fetch(X_TWEET_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error(`X scheduled tweet failed (draft ${draftId}):`, res.status, detail);
    // 402 (رصيد) و429 (rate limit) و5xx مؤقّتة — يعاد المحاولة في الدورة التالية
    return { ok: false, error: `فشل النشر على X (${res.status}).` };
  }

  const json = (await res.json()) as { data: { id: string } };

  // 5) وسم المسوّدة + مسح الجدولة
  await admin
    .from("content_drafts")
    .update({
      published_at: new Date().toISOString(),
      scheduled_for: null,
    })
    .eq("id", draftId);

  return { ok: true, tweetId: json.data.id };
}

/** نسخة admin من جلب/تجديد التوكن (مطابقة لمنطق x-publish.ts). */
async function getValidAccessTokenAdmin(userId: string): Promise<string> {
  const admin = supabaseAdmin;
  const { data: cred, error } = await admin
    .from("lawyer_x_credentials")
    .select("access_token_enc, refresh_token_enc, token_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !cred) {
    throw new Error("لم يُربَط حساب X لهذا المحامي.");
  }

  const expiresAt = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() : 0;
  if (expiresAt - REFRESH_BUFFER_MS > Date.now()) {
    return decrypt(cred.access_token_enc);
  }

  if (!cred.refresh_token_enc) {
    throw new Error("انتهت صلاحيّة توكن X ولا يوجد refresh token.");
  }
  const refreshToken = decrypt(cred.refresh_token_enc);

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("إعدادات X غير مكتملة على الخادم.");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const refreshRes = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  });

  if (!refreshRes.ok) {
    console.error("X refresh failed (cron):", await refreshRes.text());
    throw new Error("فشل تجديد توكن X.");
  }

  const token = (await refreshRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const newExpiry = new Date(Date.now() + token.expires_in * 1000).toISOString();
  await admin
    .from("lawyer_x_credentials")
    .update({
      access_token_enc: encrypt(token.access_token),
      refresh_token_enc: token.refresh_token
        ? encrypt(token.refresh_token)
        : cred.refresh_token_enc,
      token_expires_at: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return token.access_token;
}
