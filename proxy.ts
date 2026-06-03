import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Route protection layer for Next.js 16 (proxy.ts, not middleware.ts).
 *
 * - /dashboard, /review, /profile  → require session
 * - /admin/*                       → require session + is_admin = TRUE
 * - /sign-in                       → redirect to /dashboard if signed in
 */

const PROTECTED_PATHS = ["/dashboard", "/review", "/profile", "/admin"];
const GUEST_ONLY_PATHS = ["/sign-in"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isGuestOnly = GUEST_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  // Fast path: ignore public routes
  if (!isProtected && !isGuestOnly) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Protected path without session → /sign-in with redirect_to
  if (isProtected && !user) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Guest-only path with session → /dashboard
  if (isGuestOnly && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Admin path requires is_admin = TRUE
  if (isAdminPath && user) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (error || !profile?.is_admin) {
      const dashUrl = new URL("/dashboard", request.url);
      dashUrl.searchParams.set("error", "admin_only");
      return NextResponse.redirect(dashUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
