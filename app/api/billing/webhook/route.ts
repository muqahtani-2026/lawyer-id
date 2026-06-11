import { NextRequest, NextResponse } from "next/server";
import { activateProFromCharge } from "@/lib/billing";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: string };
    if (body.id) {
      await activateProFromCharge(body.id);
    }
  } catch {
    // نردّ 200 دائمًا حتّى لا يُعيد Tap الإرسال بلا داعٍ
  }
  return NextResponse.json({ received: true });
}
