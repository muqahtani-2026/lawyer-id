import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export interface FullProfile {
  email: string | null;
  full_name: string | null;
  target_audience: string | null;
  writing_style: string | null;
  preferred_length: string | null;
  favorite_phrases: string[] | null;
  avoided_phrases: string[] | null;
  style_notes: string | null;
  years_experience: number | null;
}

export interface WritingSample {
  id: string;
  title: string | null;
  sample_text: string;
  sample_type: string;
  platform_context: string | null;
  notes: string | null;
  created_at: string;
}

export interface NotificationPrefs {
  telegram_enabled: boolean;
  telegram_chat_id: string | null;
  email_enabled: boolean;
  email_address: string | null;
  preferred_send_hour: number;
}

// ============================================================
// Queries
// ============================================================

/**
 * Fetch combined profile data from `profiles` + `lawyer_profiles`.
 */
export async function getFullProfile(userId: string): Promise<FullProfile> {
  const supabase = await createClient();

  const [profileResult, lawyerProfileResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("lawyer_profiles")
      .select(
        "target_audience, writing_style, preferred_length, favorite_phrases, avoided_phrases, style_notes, years_experience"
      )
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  return {
    email: profileResult.data?.email ?? null,
    full_name: profileResult.data?.full_name ?? null,
    target_audience: lawyerProfileResult.data?.target_audience ?? null,
    writing_style: lawyerProfileResult.data?.writing_style ?? null,
    preferred_length: lawyerProfileResult.data?.preferred_length ?? null,
    favorite_phrases: lawyerProfileResult.data?.favorite_phrases ?? null,
    avoided_phrases: lawyerProfileResult.data?.avoided_phrases ?? null,
    style_notes: lawyerProfileResult.data?.style_notes ?? null,
    years_experience: lawyerProfileResult.data?.years_experience ?? null,
  };
}

/**
 * Fetch all writing samples for the user, newest first.
 */
export async function getWritingSamples(userId: string): Promise<WritingSample[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("writing_samples")
    .select("id, title, sample_text, sample_type, platform_context, notes, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data as WritingSample[]) ?? [];
}

/**
 * Fetch notification preferences. Returns sensible defaults if row doesn't exist.
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPrefs> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notification_preferences")
    .select(
      "telegram_enabled, telegram_chat_id, email_enabled, email_address, preferred_send_hour"
    )
    .eq("user_id", userId)
    .maybeSingle();

  return {
    telegram_enabled: data?.telegram_enabled ?? false,
    telegram_chat_id: data?.telegram_chat_id ?? null,
    email_enabled: data?.email_enabled ?? true,
    email_address: data?.email_address ?? null,
    preferred_send_hour: data?.preferred_send_hour ?? 8,
  };
}
