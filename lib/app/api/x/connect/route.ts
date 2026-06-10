import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/tier";

/**
 * GET /api/x/connect
 * يبدأ تدفّق OAuth 2.0 PKCE لربط حساب X بحساب المحامي.
 *
 * الخطوات:
 *  1) التأكّد أنّ المستخدم مسجَّل دخول وأنّ tier = 'pro'.
 *  2) توليد code_verifier + code_challenge (S256) + state.
 *  3) تخزين verifier/state في httpOnly cookies (للتحقّق في callback).
 *  4) إعادة التوجيه إلى شاشة تفويض X.
 */

const X_AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";
const X_SCOPES = "tweet.read tweet.write users.read offline.access";
const COOKIE_MAX_AGE = 60 * 10; // 10 دقائق

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function GET() {
  // 1) المصادقة + التحقّق من الطبقة
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", getBaseUrl()));
  }
  if ((await getUserTier()) !== "pro") {
    return NextResponse.redirect(new URL("/profile?x=forbidden", getBaseUrl()));
  }

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "X_CLIENT_ID أو X_REDIRECT_URI غير مضبوط." },
      { status: 500 },
    );
  }

  // 2) PKCE
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());
  const state = base64url(crypto.randomBytes(16));

  // 3) تخزين verifier + state في cookies (httpOnly)
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
  cookieStore.set("x_pkce_verifier", codeVerifier, cookieOpts);
  cookieStore.set("x_oauth_state", state, cookieOpts);

  // 4) إعادة التوجيه إلى X
  const authorize = new URL(X_AUTHORIZE_URL);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", X_SCOPES);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", codeChallenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  return NextResponse.redirect(authorize.toString());
}

function getBaseUrl(): string {
  // يُشتقّ من X_REDIRECT_URI (نفس الأصل) أو من متغيّر الموقع.
  const redirect = process.env.X_REDIRECT_URI;
  if (redirect) return new URL(redirect).origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://lawyer-id-tgi1.vercel.app";
}
