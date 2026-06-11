import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createCharge } from "@/lib/tap";

function baseUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const origin = baseUrl(req);
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, tier")
    .eq("id", user.id)
    .single();

  if (profile?.tier === "pro") {
    return NextResponse.redirect(new URL("/upgrade/success", origin));
  }

  const price = Number(process.env.PRO_PRICE_SAR ?? "109");

  try {
    const charge = await createCharge({
      amount: price,
      currency: "SAR",
      customerName: profile?.full_name ?? "Lawyer",
      customerEmail: profile?.email ?? user.email ?? "",
      metadata: { user_id: user.id },
      redirectUrl: `${origin}/api/billing/callback`,
      postUrl: `${origin}/api/billing/webhook`,
      description: "Lawyer ID Pro — اشتراك شهريّ",
    });

    const url = charge.transaction?.url;
    if (!url) {
      return NextResponse.redirect(new URL("/upgrade?error=init", origin));
    }
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/upgrade?error=tap", origin));
  }
}
