"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types & Constants
// ============================================================

export interface ActionResult {
  success: boolean;
  error?: string;
}

const VALID_WRITING_STYLES = ["formal", "friendly", "educational", "analytical", "concise"] as const;
const VALID_PREFERRED_LENGTHS = ["short_tweet", "medium_post", "long_article"] as const;
const VALID_SAMPLE_TYPES = ["social", "blog", "linkedin"] as const;

// ============================================================
// Helpers
// ============================================================

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return user.id;
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  // Supabase PostgrestError isn't an Error instance but has .message
  if (typeof e === "object" && e !== null && "message" in e) {
    const msg = (e as { message: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "خطأ غير متوقَّع — أعد المحاولة.";
}

function revalidateProfilePaths(): void {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

// ============================================================
// Actions
// ============================================================

/**
 * Update lawyer_profile fields (style settings).
 */
export async function updateProfile(updates: {
  target_audience?: string;
  writing_style?: string;
  preferred_length?: string;
  favorite_phrases?: string[];
  avoided_phrases?: string[];
  style_notes?: string;
}): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    // Validation
    if (
      updates.writing_style !== undefined &&
      updates.writing_style !== "" &&
      !VALID_WRITING_STYLES.includes(updates.writing_style as typeof VALID_WRITING_STYLES[number])
    ) {
      return { success: false, error: "قيمة أسلوب الكتابة غير صحيحة." };
    }
    if (
      updates.preferred_length !== undefined &&
      updates.preferred_length !== "" &&
      !VALID_PREFERRED_LENGTHS.includes(updates.preferred_length as typeof VALID_PREFERRED_LENGTHS[number])
    ) {
      return { success: false, error: "قيمة الطول المُفضَّل غير صحيحة." };
    }
    if (updates.favorite_phrases && updates.favorite_phrases.length > 50) {
      return { success: false, error: "الحدّ الأقصى 50 عبارة مُفضَّلة." };
    }
    if (updates.avoided_phrases && updates.avoided_phrases.length > 50) {
      return { success: false, error: "الحدّ الأقصى 50 عبارة مُتجنَّبة." };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.target_audience !== undefined) {
      updateData.target_audience = updates.target_audience.trim() || null;
    }
    if (updates.writing_style !== undefined) {
      updateData.writing_style = updates.writing_style || null;
    }
    if (updates.preferred_length !== undefined) {
      updateData.preferred_length = updates.preferred_length || null;
    }
    if (updates.favorite_phrases !== undefined) {
      updateData.favorite_phrases = updates.favorite_phrases
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }
    if (updates.avoided_phrases !== undefined) {
      updateData.avoided_phrases = updates.avoided_phrases
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    }
    if (updates.style_notes !== undefined) {
      updateData.style_notes = updates.style_notes.trim() || null;
    }

    // Use update (not upsert) because lawyer_profiles.user_id has no UNIQUE constraint.
    // The row is expected to exist (created by signup trigger).
    const { error, count } = await supabase
      .from("lawyer_profiles")
      .update(updateData, { count: "exact" })
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      // Fallback: row doesn't exist — insert it (rare case for users who skipped trigger).
      const { error: insertError } = await supabase
        .from("lawyer_profiles")
        .insert({ user_id: userId, full_name: "—", ...updateData });
      if (insertError) throw insertError;
    }

    revalidateProfilePaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Add a new writing sample.
 */
export async function addSample(input: {
  title?: string;
  sample_text: string;
  sample_type?: string;
  platform_context?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    const text = input.sample_text?.trim();
    if (!text) {
      return { success: false, error: "نصّ العيّنة مطلوب." };
    }
    if (text.length > 5000) {
      return { success: false, error: "نصّ العيّنة يجب أن يكون أقلّ من 5000 حرف." };
    }

    const sampleType = input.sample_type ?? "social";
    if (!VALID_SAMPLE_TYPES.includes(sampleType as typeof VALID_SAMPLE_TYPES[number])) {
      return { success: false, error: "نوع العيّنة غير صحيح." };
    }

    const { error } = await supabase.from("writing_samples").insert({
      user_id: userId,
      title: input.title?.trim() || null,
      sample_text: text,
      sample_type: sampleType,
      platform_context: input.platform_context?.trim() || null,
      notes: input.notes?.trim() || null,
    });

    if (error) throw error;

    revalidateProfilePaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Update an existing writing sample (ownership-checked).
 */
export async function updateSample(
  sampleId: string,
  updates: {
    title?: string;
    sample_text?: string;
    sample_type?: string;
    platform_context?: string;
    notes?: string;
  }
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    if (updates.sample_text !== undefined && !updates.sample_text.trim()) {
      return { success: false, error: "نصّ العيّنة لا يمكن أن يكون فارغًا." };
    }
    if (updates.sample_text !== undefined && updates.sample_text.length > 5000) {
      return { success: false, error: "نصّ العيّنة يجب أن يكون أقلّ من 5000 حرف." };
    }

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title.trim() || null;
    if (updates.sample_text !== undefined) updateData.sample_text = updates.sample_text.trim();
    if (updates.sample_type !== undefined) updateData.sample_type = updates.sample_type;
    if (updates.platform_context !== undefined)
      updateData.platform_context = updates.platform_context.trim() || null;
    if (updates.notes !== undefined) updateData.notes = updates.notes.trim() || null;

    const { error, count } = await supabase
      .from("writing_samples")
      .update(updateData, { count: "exact" })
      .eq("id", sampleId)
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      return { success: false, error: "لم يتمّ العثور على العيّنة." };
    }

    revalidateProfilePaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Delete a writing sample (ownership-checked).
 */
export async function deleteSample(sampleId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    const { error, count } = await supabase
      .from("writing_samples")
      .delete({ count: "exact" })
      .eq("id", sampleId)
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      return { success: false, error: "لم يتمّ العثور على العيّنة." };
    }

    revalidateProfilePaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Upsert notification preferences (row may not exist).
 */
export async function updateNotificationPreferences(updates: {
  telegram_enabled?: boolean;
  telegram_chat_id?: string | null;
  email_enabled?: boolean;
  email_address?: string | null;
  preferred_send_hour?: number;
}): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    if (updates.preferred_send_hour !== undefined) {
      const hour = updates.preferred_send_hour;
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return { success: false, error: "ساعة الإرسال يجب أن تكون بين 0 و 23." };
      }
    }

    const upsertData: Record<string, unknown> = {
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    if (updates.telegram_enabled !== undefined) upsertData.telegram_enabled = updates.telegram_enabled;
    if (updates.telegram_chat_id !== undefined)
      upsertData.telegram_chat_id = updates.telegram_chat_id?.trim() || null;
    if (updates.email_enabled !== undefined) upsertData.email_enabled = updates.email_enabled;
    if (updates.email_address !== undefined)
      upsertData.email_address = updates.email_address?.trim() || null;
    if (updates.preferred_send_hour !== undefined)
      upsertData.preferred_send_hour = updates.preferred_send_hour;

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(upsertData, { onConflict: "user_id" });

    if (error) throw error;

    revalidateProfilePaths();
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}
