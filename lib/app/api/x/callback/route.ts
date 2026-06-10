import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";

/**
 * GET /api/x/callback?code=...&state=...
 * يكمل تدفّق OAuth: يتحقّق من state، يبادل code بتوكنات، يجلب هوية X،
 * يشفّر التوكنات، ويخزّنها (upsert) في lawyer_x_credentials عبر service_role.
 */

const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
const X_ME_URL = "https://api.x.com/2/users/me";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL("/profile?x=denied", base));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("x_oauth_state")?.value;
  const codeVerifier = cookieStore.get("x_pkce_verifier")?.value;

  // تنظيف الـ cookies مبكّرًا (تُستهلَك مرّة واحدة)
  cookieStore.delete("x_oauth_state");
  cookieStore.delete("x_pkce_verifier");

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return NextResponse.redirect(new URL("/profile?x=invalid_state", base));
  }

  // المستخدم الحاليّ (صاحب الربط)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/profile?x=server_misconfig", base));
  }

  // تبادل code بتوكنات — عميل سرّيّ (Basic auth) + PKCE verifier
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
    }),
  });

  if (!tokenRes.ok) {
    console.error("X token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(new URL("/profile?x=token_error", base));
  }

  const token = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };

  // جلب هوية حساب X
  const meRes = await fetch(X_ME_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) {
    console.error("X /users/me failed:", await meRes.text());
    return NextResponse.redirect(new URL("/profile?x=me_error", base));
  }
  const me = (await meRes.json()) as { data: { id: string; username: string } };

  // التشفير + الحفظ عبر service_role (الأعمدة _enc محجوبة عن authenticated)
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

  const { error: upsertError } = await admin
    .from("lawyer_x_credentials")
    .upsert(
      {
        user_id: user.id,
        x_user_id: me.data.id,
        x_username: me.data.username,
        access_token_enc: encrypt(token.access_token),
        refresh_token_enc: token.refresh_token ? encrypt(token.refresh_token) : null,
        token_expires_at: expiresAt,
        scope: token.scope ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    console.error("upsert lawyer_x_credentials failed:", upsertError);
    return NextResponse.redirect(new URL("/profile?x=save_error", base));
  }

  return NextResponse.redirect(new URL("/profile?x=connected", base));
}
