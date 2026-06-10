"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * نشر مسوّدة على X.
 * - gating: يجب أن يكون tier = 'pro'.
 * - يقرأ توكن المحامي (عبر service_role)، يفكّ تشفيره، يجدّده إن انتهى،
 *   ثمّ يرسل التغريدة عبر POST https://api.x.com/2/tweets.
 *
 * يُستدعى من زرّ "وافق وانشر إلى X" في /review.
 */

const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_TWEET_URL = "https://api.x.com/2/tweets";
const TWEET_MAX = 280;
const REFRESH_BUFFER_MS = 60 * 1000; // جدّد قبل الانتهاء بدقيقة

export type PublishResult =
  | { ok: true; tweetId: string }
  | { ok: false; error: string };

export async function publishDraftToX(draftId: string): Promise<PublishResult> {
  // 1) المصادقة + gating
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "غير مسجَّل الدخول." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  if (profile?.tier !== "pro") {
    return { ok: false, error: "النشر على X متاح لطبقة Pro فقط." };
  }

  // 2) جلب نصّ المسوّدة (RLS تضمن ملكيّة المستخدم لها)
  const { data: draft, error: draftError } = await supabase
    .from("content_drafts")
    .select("body, title")
    .eq("id", draftId)
    .single();
  if (draftError || !draft) {
    return { ok: false, error: "تعذّر العثور على المسوّدة." };
  }

  const text = (draft.body ?? "").trim();
  if (!text) return { ok: false, error: "المسوّدة فارغة." };
  if (text.length > TWEET_MAX) {
    return {
      ok: false,
      error: `النصّ ${text.length} محرفًا ويتجاوز حدّ التغريدة (${TWEET_MAX}). اختر صيغة x_short أو اختصر.`,
    };
  }

  // 3) الحصول على توكن صالح (عبر service_role)
  const admin = supabaseAdmin;
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(admin, user.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "فشل تجهيز التوكن." };
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
    console.error("X tweet failed:", detail);
    return { ok: false, error: `فشل النشر على X (${res.status}).` };
  }

  const json = (await res.json()) as { data: { id: string } };

  // 5) (اختياريّ) وسم المسوّدة كمنشورة — عدّل أسماء الأعمدة حسب جدولك.
  // ادمج هنا: await supabase.from("content_drafts").update({ status: "published", published_at: new Date().toISOString() }).eq("id", draftId);

  return { ok: true, tweetId: json.data.id };
}

/**
 * يقرأ توكن X للمحامي، يفكّ تشفيره، ويجدّده تلقائيًّا إن انتهى/أوشك.
 * يُحدّث الصفّ بالتوكن الجديد المشفّر عند التجديد.
 */
async function getValidAccessToken(
  admin: typeof supabaseAdmin,
  userId: string,
): Promise<string> {
  const { data: cred, error } = await admin
    .from("lawyer_x_credentials")
    .select("access_token_enc, refresh_token_enc, token_expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !cred) {
    throw new Error("لم يُربَط حساب X بعد. اربط الحساب من صفحة المِلَفّ.");
  }

  const expiresAt = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() : 0;
  const stillValid = expiresAt - REFRESH_BUFFER_MS > Date.now();
  if (stillValid) {
    return decrypt(cred.access_token_enc);
  }

  // تجديد
  if (!cred.refresh_token_enc) {
    throw new Error("انتهت صلاحيّة توكن X ولا يوجد refresh token. أعد ربط الحساب.");
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
    console.error("X refresh failed:", await refreshRes.text());
    throw new Error("فشل تجديد توكن X. أعد ربط الحساب.");
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
