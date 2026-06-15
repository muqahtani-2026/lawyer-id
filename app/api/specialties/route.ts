import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** التخصّصات النشطة (عامّ) — يستخدمها مُعالج التسجيل لعرض كلّ المجالات المتاحة. */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );
    const { data } = await supabase
      .from("specialties")
      .select("slug, name_ar, description")
      .eq("is_active", true)
      .order("name_ar", { ascending: true });
    return NextResponse.json({ ok: true, specialties: data ?? [] });
  } catch {
    return NextResponse.json({ ok: false, specialties: [] });
  }
}
