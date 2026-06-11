"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * نشر مسوّدة على LinkedIn (Pro — Phase 8.3).
 * - gating: tier = 'pro' + المسوّدة approved + الصيغة linkedin_medium + غير منشورة.
 * - يقرأ توكن المحامي (service_role)، يفكّ تشفيره، يحاول التجديد إن انتهى
 *   ووُجد refresh token (نادر مع LinkedIn — وإلّا يطلب إعادة الربط)،
 *   ثمّ ينشر عبر POST /v2/ugcPosts ويحدّث published_at.
 *
 * يُستدعى من زرّ "نشر إلى LinkedIn" في /review.
 */

const LI_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LI_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";
const POST_MAX = 3000;
const REFRESH_BUFFER_MS = 60 * 1000;

export type LinkedInPublishResult =
  | { ok: true; postUrn: string }
  | { ok: false; error: string };

export async function publishDraftToLinkedIn(
  draftId: string,
): Promise<LinkedInPublishResult> {
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
    return { ok: false, error: "النشر على LinkedIn متاح لطبقة Pro فقط." };
  }

  // 2) جلب المسوّدة (RLS تضمن الملكيّة)
  const { data: draft, error: draftError } = await supabase
    .from("content_drafts")
    .select("draft_content, status, content_format, published_at")
    .eq("id", draftId)
    .single();
  if (draftError || !draft) {
    return { ok: false, error: "تعذّر العثور على المسوّدة." };
  }
  if (draft.status !== "approved") {
    return { ok: false, error: "وافِق على المسوّدة أوّلًا قبل النشر." };
  }
  if (draft.content_format !== "linkedin_medium") {
    return { ok: false, error: "هذه الصيغة ليست منشور LinkedIn (linkedin_medium)." };
  }
  if (draft.published_at) {
    return { ok: false, error: "هذه المسوّدة منشورة مسبقًا." };
  }

  const text = (draft.draft_content ?? "").trim();
  if (!text) return { ok: false, error: "المسوّدة فارغة." };
  if (text.length > POST_MAX) {
    return {
      ok: false,
      error: `النصّ ${text.length} محرفًا ويتجاوز حدّ LinkedIn (${POST_MAX}). اختصره ثمّ أعد المحاولة.`,
    };
  }

  // 3) توكن صالح + URN (عبر service_role)
  const admin = supabaseAdmin;
  let accessToken: string;
  let authorUrn: string;
  try {
    const t = await getValidLinkedInToken(admin, user.id);
    accessToken = t.accessToken;
    authorUrn = t.urn;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "فشل تجهيز التوكن." };
  }

  // 4) النشر — ugcPosts (نصّيّ، عامّ)
  const res = await fetch(LI_UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("LinkedIn post failed:", res.status, detail);
    if (res.status === 401) {
      return { ok: false, error: "انتهت صلاحيّة ربط LinkedIn — أعد الربط من صفحة المِلَفّ." };
    }
    return { ok: false, error: `فشل النشر على LinkedIn (${res.status}).` };
  }

  const postUrn =
    res.headers.get("x-restli-id") ??
    ((await res.json().catch(() => null)) as { id?: string } | null)?.id ??
    "";

  // 5) وسم المسوّدة منشورة (service_role + قيد الملكيّة)
  await admin
    .from("content_drafts")
    .update({ published_at: new Date().toISOString() })
    .eq("id", draftId)
    .eq("user_id", user.id);

  return { ok: true, postUrn };
}

/**
 * يقرأ توكن LinkedIn للمحامي ويفكّ تشفيره. إن انتهى/أوشك:
 * - وُجد refresh token → يجدّد ويحدّث الصفّ.
 * - لا يوجد (الوضع المعتاد مع LinkedIn) → خطأ يطلب إعادة الربط.
 */
async function getValidLinkedInToken(
  admin: typeof supabaseAdmin,
  userId: string,
): Promise<{ accessToken: string; urn: string }> {
  const { data: cred, error } = await admin
    .from("lawyer_linkedin_credentials")
    .select("access_token_enc, refresh_token_enc, token_expires_at, linkedin_urn")
    .eq("user_id", userId)
    .single();

  if (error || !cred) {
    throw new Error("لم يُربَط حساب LinkedIn بعد. اربط الحساب من صفحة المِلَفّ.");
  }
  const urn = cred.linkedin_urn as string;

  const expiresAt = cred.token_expires_at ? new Date(cred.token_expires_at).getTime() : 0;
  const stillValid = expiresAt - REFRESH_BUFFER_MS > Date.now();
  if (stillValid) {
    return { accessToken: decrypt(cred.access_token_enc), urn };
  }

  if (!cred.refresh_token_enc) {
    throw new Error("انتهت صلاحيّة ربط LinkedIn (60 يومًا) — أعد الربط من صفحة المِلَفّ.");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("إعدادات LinkedIn غير مكتملة على الخادم.");

  const refreshRes = await fetch(LI_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decrypt(cred.refresh_token_enc),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!refreshRes.ok) {
    console.error("LinkedIn refresh failed:", await refreshRes.text());
    throw new Error("فشل تجديد توكن LinkedIn — أعد ربط الحساب.");
  }

  const token = (await refreshRes.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };

  await admin
    .from("lawyer_linkedin_credentials")
    .update({
      access_token_enc: encrypt(token.access_token),
      refresh_token_enc: token.refresh_token
        ? encrypt(token.refresh_token)
        : cred.refresh_token_enc,
      token_expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { accessToken: token.access_token, urn };
}
