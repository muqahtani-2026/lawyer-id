import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

/**
 * GET /api/linkedin/callback?code=...&state=...
 * يكمل تدفّق OAuth: يتحقّق من state، يبادل code بتوكن، يجلب هويّة العضو
 * (OpenID userinfo)، يشفّر التوكنات، ويخزّنها (upsert) في
 * lawyer_linkedin_credentials عبر service_role.
 *
 * ملاحظة LinkedIn: التبادل بـ client_secret في جسم الطلب (لا Basic auth)،
 * والتوكن صالح ~60 يومًا. refresh_token لا يُمنح إلّا لتطبيقات الشركاء —
 * إن وُجد خزّنّاه، وإلّا فإعادة الربط بعد الانتهاء.
 */

const LI_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LI_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL("/profile?li=denied", base));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("li_oauth_state")?.value;
  cookieStore.delete("li_oauth_state");

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/profile?li=invalid_state", base));
  }

  // المستخدم الحاليّ (صاحب الربط)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", base));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/profile?li=server_misconfig", base));
  }

  // تبادل code بتوكن — client_secret في الجسم (نمط LinkedIn)
  const tokenRes = await fetch(LI_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    console.error("LinkedIn token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/profile?li=token_error", base));
  }

  const token = (await tokenRes.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope?: string;
  };

  // جلب هويّة العضو (OpenID Connect userinfo)
  const meRes = await fetch(LI_USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) {
    console.error("LinkedIn userinfo failed:", await meRes.text());
    return NextResponse.redirect(new URL("/profile?li=me_error", base));
  }
  const me = (await meRes.json()) as { sub: string; name?: string };

  // التشفير + الحفظ عبر service_role (أعمدة _enc محجوبة عن authenticated)
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

  const { error: upsertError } = await admin
    .from("lawyer_linkedin_credentials")
    .upsert(
      {
        user_id: user.id,
        linkedin_user_id: me.sub,
        linkedin_urn: `urn:li:person:${me.sub}`,
        access_token_enc: encrypt(token.access_token),
        refresh_token_enc: token.refresh_token ? encrypt(token.refresh_token) : null,
        token_expires_at: expiresAt,
        scope: token.scope ?? "openid profile email w_member_social",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    console.error("upsert lawyer_linkedin_credentials failed:", upsertError);
    return NextResponse.redirect(new URL("/profile?li=save_error", base));
  }

  return NextResponse.redirect(new URL("/profile?li=connected", base));
}
