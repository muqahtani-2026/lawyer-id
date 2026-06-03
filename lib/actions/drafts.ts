"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================================
// Helpers
// ============================================================

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

function revalidateDraftPaths(draftId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/review");
  revalidatePath(`/review/${draftId}`);
}

function formatError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "خطأ غير متوقَّع — أعد المحاولة.";
}

// ============================================================
// Actions
// ============================================================

/**
 * Approve a draft.
 * Sets status='approved', approved_at=now(), reviewed_at=now().
 * Clears rejection_reason.
 */
export async function approveDraft(draftId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error, count } = await supabase
      .from("content_drafts")
      .update(
        {
          status: "approved",
          approved_at: now,
          reviewed_at: now,
          rejection_reason: null,
          updated_at: now,
        },
        { count: "exact" }
      )
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      return { success: false, error: "لم يتمّ العثور على المسوّدة أو ليست ضمن ملكيّتك." };
    }

    revalidateDraftPaths(draftId);
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Reject a draft with a reason.
 * Sets status='rejected', reviewed_at=now(), rejection_reason.
 * Clears approved_at.
 */
export async function rejectDraft(
  draftId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      return { success: false, error: "سبب الرفض مطلوب." };
    }
    if (trimmedReason.length > 500) {
      return { success: false, error: "سبب الرفض يجب أن يكون أقلّ من 500 حرف." };
    }

    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error, count } = await supabase
      .from("content_drafts")
      .update(
        {
          status: "rejected",
          reviewed_at: now,
          rejection_reason: trimmedReason,
          approved_at: null,
          updated_at: now,
        },
        { count: "exact" }
      )
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      return { success: false, error: "لم يتمّ العثور على المسوّدة أو ليست ضمن ملكيّتك." };
    }

    revalidateDraftPaths(draftId);
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Update a draft's title, summary, and/or content.
 * Only updates fields that are provided.
 */
export async function updateDraft(
  draftId: string,
  updates: {
    draft_title?: string;
    draft_summary?: string;
    draft_content?: string;
  }
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.draft_title !== undefined) {
      updateData.draft_title = updates.draft_title.trim() || null;
    }
    if (updates.draft_summary !== undefined) {
      updateData.draft_summary = updates.draft_summary.trim() || null;
    }
    if (updates.draft_content !== undefined) {
      const content = updates.draft_content.trim();
      if (!content) {
        return { success: false, error: "محتوى المسوّدة لا يمكن أن يكون فارغًا." };
      }
      updateData.draft_content = content;
    }

    const { error, count } = await supabase
      .from("content_drafts")
      .update(updateData, { count: "exact" })
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      return { success: false, error: "لم يتمّ العثور على المسوّدة أو ليست ضمن ملكيّتك." };
    }

    revalidateDraftPaths(draftId);
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}

/**
 * Publish a draft (mark as published).
 * Only allowed for approved drafts (enforced by the UI; server side is permissive).
 */
export async function publishDraft(draftId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error, count } = await supabase
      .from("content_drafts")
      .update(
        {
          status: "published",
          published_at: now,
          updated_at: now,
        },
        { count: "exact" }
      )
      .eq("id", draftId)
      .eq("user_id", userId);

    if (error) throw error;
    if (count === 0) {
      return { success: false, error: "لم يتمّ العثور على المسوّدة أو ليست ضمن ملكيّتك." };
    }

    revalidateDraftPaths(draftId);
    return { success: true };
  } catch (e) {
    return { success: false, error: formatError(e) };
  }
}
