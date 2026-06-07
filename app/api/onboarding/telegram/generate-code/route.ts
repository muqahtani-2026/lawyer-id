import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Unambiguous alphabet: no 0/O/1/I/L to avoid confusing the lawyer.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 4;
const EXPIRY_MINUTES = 60;
const MAX_ATTEMPTS = 5;
const BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "LawyerIDSA_bot";

function generateCode(): string {
  const buffer = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(buffer);
  let suffix = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    suffix += CODE_ALPHABET[buffer[i] % CODE_ALPHABET.length];
  }
  return `LID-${suffix}`;
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { error: cleanupError } = await supabaseAdmin
      .from("pending_telegram_links")
      .delete()
      .eq("user_id", user.id)
      .is("linked_at", null);

    if (cleanupError) {
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    let code = "";
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const candidate = generateCode();
      const { data: existing, error: checkError } = await supabaseAdmin
        .from("pending_telegram_links")
        .select("id")
        .eq("code", candidate)
        .maybeSingle();

      if (checkError) {
        return NextResponse.json({ error: "database_error" }, { status: 500 });
      }
      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return NextResponse.json(
        { error: "could_not_generate_code" },
        { status: 500 }
      );
    }

    const expiresAt = new Date(
      Date.now() + EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from("pending_telegram_links")
      .insert({
        code,
        user_id: user.id,
        expires_at: expiresAt,
      });

    if (insertError) {
      return NextResponse.json({ error: "database_error" }, { status: 500 });
    }

    return NextResponse.json({
      code,
      expiresAt,
      deepLink: `https://t.me/${BOT_USERNAME}?start=${code}`,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}