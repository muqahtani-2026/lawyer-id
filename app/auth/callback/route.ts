import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // (1) نمط token_hash — يعمل عبر أي جهاز أو متصفّح (الرابط الجديد)
  if (tokenHash && type) {
    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (error) {
        console.error("[auth/callback] verifyOtp failed:", error.message);
        return NextResponse.redirect(
          `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error("[auth/callback] verifyOtp unexpected error:", err);
      const message = err instanceof Error ? err.message : "unknown_error";
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(message)}`
      );
    }
  }

  // (2) نمط PKCE (code) — احتياطيّ، يعمل في نفس المتصفّح فقط
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("[auth/callback] exchange failed:", error.message);
        return NextResponse.redirect(
          `${origin}/sign-in?error=${encodeURIComponent(error.message)}`
        );
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error("[auth/callback] unexpected error:", err);
      const message = err instanceof Error ? err.message : "unknown_error";
      return NextResponse.redirect(
        `${origin}/sign-in?error=${encodeURIComponent(message)}`
      );
    }
  }

  // (3) لا يوجد token_hash ولا code
  return NextResponse.redirect(`${origin}/sign-in?error=missing_code`);
}