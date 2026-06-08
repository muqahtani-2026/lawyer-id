"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface DraftFeedback {
  rating: number;
  comment: string | null;
  would_publish: boolean | null;
}

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user.id;
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "خطأ غير متوقَّع — أعد المحاولة.";
}

/**
 * Submit or update feedback for a draft (one feedback row per draft, upsert on draft_id).
 */
export async function submitFeedback(
  draftId: string,
  rating: number,
  comment: string,
  wouldPublish: boolean | null
): Promise<ActionResult> {
  try {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { success: false, error: "التقييم يجب أن يكون من 1 إلى 5." };
    }
    const trimmedComment = comment?.trim() || null;
    if (trimmedComment && trimmedComment.length > 1000) {
      return { success: false, error: "التعليق يجب أن يكون أقلّ من 1000 حرف." };
    }

    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    // حارس الملكيّة — المحامي يقيّم مسوّداته فقط
    const { data: own } = await supabase
      .from("content_drafts")
      .select("id")
      .eq("id", draftId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!own) {
      return { success: false, error: "لم يتمّ العثور على المسوّدة أو ليست ضمن ملكيّتك." };
    }

    const { error } = await supabase.from("feedback").upsert(
      {
        draft_id: draftId,
        user_id: userId,
        rating,
        comment: trimmedComment,
        would_publish: wouldPublish,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "draft_id" }
    );

    if (error) throw error;

    revalidatePath(`/review/${draftId}`);
    revalidatePath("/review");
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Read the current user's existing feedback for a draft (for pre-filling the rating widget).
 * Returns null if no feedback exists yet, or on any error (widget falls back to empty state).
 * RLS ensures the user can only read their own feedback row.
 */
export async function getMyFeedbackForDraft(
  draftId: string
): Promise<DraftFeedback | null> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("feedback")
      .select("rating, comment, would_publish")
      .eq("draft_id", draftId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      rating: data.rating,
      comment: data.comment ?? null,
      would_publish: data.would_publish ?? null,
    };
  } catch {
    return null;
  }
}
