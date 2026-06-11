import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/tier";

/**
 * GET /api/linkedin/connect
 * يبدأ تدفّق OAuth 2.0 لربط حساب LinkedIn بحساب المحامي (Pro فقط).
 *
 * LinkedIn (3-legged OAuth، بدون PKCE):
 *  1) التأكّد أنّ المستخدم مسجَّل دخول وأنّ tier = 'pro'.
 *  2) توليد state وتخزينه في httpOnly cookie.
 *  3) إعادة التوجيه إلى شاشة تفويض LinkedIn.
 *
 * Scopes: openid profile email (هويّة العضو) + w_member_social (النشر).
 */

const LI_AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LI_SCOPES = "openid profile email w_member_social";
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
    return NextResponse.redirect(new URL("/sign-in", getBaseUrl()));
  }
  if ((await getUserTier()) !== "pro") {
    return NextResponse.redirect(new URL("/profile?li=forbidden", getBaseUrl()));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/profile?li=server_misconfig", getBaseUrl()));
  }

  // 2) state ضدّ CSRF
  const state = base64url(crypto.randomBytes(16));
  const cookieStore = await cookies();
  cookieStore.set("li_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  // 3) إعادة التوجيه إلى LinkedIn
  const authorize = new URL(LI_AUTHORIZE_URL);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", LI_SCOPES);
  authorize.searchParams.set("state", state);

  return NextResponse.redirect(authorize.toString());
}

function getBaseUrl(): string {
  const redirect = process.env.LINKEDIN_REDIRECT_URI;
  if (redirect) return new URL(redirect).origin;
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://lawyer-id-tgi1.vercel.app";
}
