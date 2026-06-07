import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_PATTERN = /^LID-[A-Z0-9]{4}$/;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const code = request.nextUrl.searchParams.get("code");
    if (!code || !CODE_PATTERN.test(code)) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    const { data: row, error } = await supabaseAdmin
      .from("pending_telegram_links")
      .select("linked_at, expires_at")
      .eq("code", code)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ linked: false, expired: false, found: false });
    }

    const linked = row.linked_at !== null;
    const expired =
      !linked && new Date(row.expires_at as string).getTime() < Date.now();

    return NextResponse.json({ linked, expired, found: true });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}