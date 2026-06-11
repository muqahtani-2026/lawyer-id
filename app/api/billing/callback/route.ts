import { NextRequest, NextResponse } from "next/server";
import { activateProFromCharge } from "@/lib/billing";

function baseUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const origin = baseUrl(req);
  const tapId = req.nextUrl.searchParams.get("tap_id");

  if (!tapId) {
    return NextResponse.redirect(new URL("/upgrade?error=missing", origin));
  }

  try {
    const result = await activateProFromCharge(tapId);
    if (result.ok) {
      return NextResponse.redirect(new URL("/upgrade/success", origin));
    }
    return NextResponse.redirect(new URL("/upgrade?error=notpaid", origin));
  } catch {
    return NextResponse.redirect(new URL("/upgrade?error=server", origin));
  }
}
