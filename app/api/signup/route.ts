import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Phase 4.2b-2: Simplified signup
// Phase 7.x: after a successful signup, send the SAME magic-link login email
// that the /sign-in page sends, so the new user can enter immediately.

const COMMERCIAL_SPECIALTY_ID = "e93453f0-64cd-4e5a-bb1a-4ee2294b26bc";

interface SignupPayload {
  full_name: string;
  email: string;
  professional_kind: "lawyer" | "trainee" | "legal_consultant";
  specialty_slug?: string;
  credential_number?: string;
  credential_file_base64: string;
  credential_file_name?: string;
  credential_file_type: string;
  target_audience: string;
  writing_style: string;
  preferred_length: string;
  favorite_phrases: string[];
  avoided_phrases: string[];
  style_notes: string;
  writing_samples: Array<{ platform: string; topic: string; text: string }>;
  telegram_enabled: boolean;
  email_enabled: boolean;
  preferred_send_hour: number;
}

type ValidationResult =
  | { ok: true; data: SignupPayload }
  | { ok: false; error: string };

function validatePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "صيغة الطلب غير صحيحة" };
  }
  const b = body as Record<string, unknown>;

  const requiredStrings = [
    "full_name",
    "email",
    "target_audience",
    "writing_style",
    "preferred_length",
  ];
  for (const f of requiredStrings) {
    if (typeof b[f] !== "string" || (b[f] as string).trim() === "") {
      return { ok: false, error: `الحقل ${f} مطلوب` };
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email as string)) {
    return { ok: false, error: "صيغة البريد الإلكتروني غير صحيحة" };
  }

  const validKinds = ["lawyer", "trainee", "legal_consultant"];
  if (!validKinds.includes(b.professional_kind as string)) {
    return { ok: false, error: "نوع التسجيل غير صحيح" };
  }
  if (typeof b.credential_file_base64 !== "string" || (b.credential_file_base64 as string).length < 10) {
    return { ok: false, error: "إرفاق الوثيقة مطلوب" };
  }
  if (typeof b.credential_file_type !== "string") {
    return { ok: false, error: "نوع الوثيقة غير صحيح" };
  }

  const validStyles = ["formal", "friendly", "educational", "analytical", "concise"];
  if (!validStyles.includes(b.writing_style as string)) {
    return { ok: false, error: "أسلوب الكتابة غير صحيح" };
  }

  const validLengths = ["short_tweet", "medium_post", "long_article"];
  if (!validLengths.includes(b.preferred_length as string)) {
    return { ok: false, error: "طول النص غير صحيح" };
  }

  if (
    !Array.isArray(b.writing_samples) ||
    b.writing_samples.length < 3 ||
    b.writing_samples.length > 5
  ) {
    return { ok: false, error: "يجب أن تكون عيّنات الكتابة بين 3 و 5" };
  }

  if (!b.telegram_enabled && !b.email_enabled) {
    return { ok: false, error: "يجب اختيار قناة إشعار واحدة على الأقلّ" };
  }

  const hour = b.preferred_send_hour;
  if (typeof hour !== "number" || hour < 0 || hour > 23) {
    return { ok: false, error: "ساعة الإرسال يجب أن تكون بين 0 و 23" };
  }

  return { ok: true, data: body as SignupPayload };
}

export async function POST(req: Request) {
  let createdUserId: string | null = null;

  try {
    const body = await req.json();
    const validation = validatePayload(body);
    if (!validation.ok) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }
    const data = validation.data;

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "هذا البريد مسجّل مسبقًا" },
        { status: 409 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });

    if (userError || !userData?.user) {
      console.error("createUser error:", userError);
      return NextResponse.json(
        { ok: false, error: userError?.message || "فشل إنشاء الحساب" },
        { status: 500 }
      );
    }

    createdUserId = userData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: createdUserId,
          email: data.email,
          full_name: data.full_name,
        },
        { onConflict: "id" }
      );

    if (profileError) throw new Error(`profiles: ${profileError.message}`);

    const { error: lpError } = await supabaseAdmin.from("lawyer_profiles").upsert({
      user_id: createdUserId,
      full_name: data.full_name,
      writing_style: data.writing_style,
      target_audience: data.target_audience,
      preferred_length: data.preferred_length,
      favorite_phrases: data.favorite_phrases,
      avoided_phrases: data.avoided_phrases,
      style_notes: data.style_notes,
    }, { onConflict: "user_id" });

    if (lpError) throw new Error(`lawyer_profiles: ${lpError.message}`);

    let specialtyId = COMMERCIAL_SPECIALTY_ID;
    if (data.specialty_slug) {
      const { data: spec } = await supabaseAdmin
        .from("specialties")
        .select("id")
        .eq("slug", data.specialty_slug)
        .maybeSingle();
      if (spec?.id) specialtyId = spec.id as string;
    }

    const { error: usError } = await supabaseAdmin.from("user_specialties").insert({
      user_id: createdUserId,
      specialty_id: specialtyId,
      is_primary: true,
    });

    if (usError) throw new Error(`user_specialties: ${usError.message}`);

    // رفع وثيقة الترخيص/التدريب/القانونيّة إلى bucket خاصّ + ضبط الدور والحالة (pending افتراضيًّا)
    const extMap: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const ext = extMap[data.credential_file_type] ?? "bin";
    const docPath = `${createdUserId}/credential.${ext}`;
    try {
      const buffer = Buffer.from(data.credential_file_base64, "base64");
      const { error: upErr } = await supabaseAdmin.storage
        .from("credentials")
        .upload(docPath, buffer, { contentType: data.credential_file_type, upsert: true });
      if (upErr) throw new Error(upErr.message);
    } catch (storageErr) {
      throw new Error(`credential upload: ${storageErr instanceof Error ? storageErr.message : "fail"}`);
    }

    const { error: pkErr } = await supabaseAdmin
      .from("profiles")
      .update({
        professional_kind: data.professional_kind,
        credential_number: data.credential_number ?? null,
        credential_doc_path: docPath,
        credential_doc_type: data.credential_file_type,
        approval_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", createdUserId);
    if (pkErr) throw new Error(`profiles(kind): ${pkErr.message}`);

    const samples = data.writing_samples.map((s) => ({
      user_id: createdUserId,
      title: s.topic,
      platform_context: s.platform,
      sample_text: s.text,
      sample_type: "social",
    }));

    const { error: wsError } = await supabaseAdmin
      .from("writing_samples")
      .insert(samples);

    if (wsError) throw new Error(`writing_samples: ${wsError.message}`);

    const { error: npError } = await supabaseAdmin
      .from("notification_preferences")
      .insert({
        user_id: createdUserId,
        telegram_enabled: data.telegram_enabled,
        email_enabled: data.email_enabled,
        email_address: data.email_enabled ? data.email : null,
        preferred_send_hour: data.preferred_send_hour,
      });

    if (npError) throw new Error(`notification_preferences: ${npError.message}`);

    // Phase 7.x: send the login link email (same as /sign-in).
    // Non-fatal: the account is created regardless. IMPORTANT: the Supabase
    // client returns send errors as a *value* ({ error }), it does NOT throw —
    // so we must read that value explicitly, otherwise failures are invisible.
    let emailSent = false;
    let emailWarning: string | null = null;
    try {
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
      );
      const origin = process.env.NEXT_PUBLIC_BASE_URL ?? new URL(req.url).origin;
      const { error: otpError } = await anon.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
      if (otpError) {
        emailWarning = otpError.message;
        console.error("signup login email error (non-fatal):", otpError.message);
      } else {
        emailSent = true;
      }
    } catch (mailErr) {
      emailWarning =
        mailErr instanceof Error ? mailErr.message : "unknown mail error";
      console.error("signup login email threw (non-fatal):", mailErr);
    }

    return NextResponse.json({
      ok: true,
      user_id: createdUserId,
      email: data.email,
      email_sent: emailSent,
      email_warning: emailWarning,
      message: emailSent
        ? "تمّ استلام طلبك! حسابك الآن بانتظار مراجعة الوثيقة واعتمادها. أرسلنا رابط الدخول إلى بريدك لمتابعة حالة الطلب."
        : "تمّ استلام طلبك! حسابك بانتظار مراجعة الوثيقة واعتمادها. يمكنك الدخول من صفحة تسجيل الدخول بإدخال بريدك لمتابعة الحالة.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطأ في الخادم";
    console.error("Signup failed:", message);

    if (createdUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        console.log("Rolled back: deleted user", createdUserId);
      } catch (rbErr) {
        console.error("Rollback failed:", rbErr);
      }
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
