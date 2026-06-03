"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CorpusFormData = {
  title: string;
  document_type: string | null;
  source_authority: string | null;
  specialty_id: string | null;
  full_text: string;
  summary: string | null;
  reference_number: string | null;
  issue_date: string | null;
  effective_date: string | null;
  source_url: string | null;
  tags: string[];
};

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

// ============================================================
// createLegalCorpus
// ============================================================

export async function createLegalCorpus(
  data: CorpusFormData
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  // Validate required fields
  if (!data.title?.trim()) {
    return { ok: false, error: "العنوان مطلوب." };
  }
  if (!data.full_text?.trim()) {
    return { ok: false, error: "النصّ الكامل للنظام مطلوب." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "غير مُصادَق عليه." };
  }

  const { data: row, error } = await supabase
    .from("legal_corpus")
    .insert({
      title: data.title.trim(),
      document_type: data.document_type?.trim() || null,
      source_authority: data.source_authority?.trim() || null,
      specialty_id: data.specialty_id || null,
      full_text: data.full_text.trim(),
      summary: data.summary?.trim() || null,
      reference_number: data.reference_number?.trim() || null,
      issue_date: data.issue_date || null,
      effective_date: data.effective_date || null,
      source_url: data.source_url?.trim() || null,
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
      uploaded_by: user.id,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/legal-corpus");
  revalidatePath("/admin");

  return { ok: true, data: { id: row.id as string } };
}

// ============================================================
// updateLegalCorpus
// ============================================================

export async function updateLegalCorpus(
  id: string,
  data: CorpusFormData
): Promise<ActionResult> {
  const supabase = await createClient();

  if (!data.title?.trim()) {
    return { ok: false, error: "العنوان مطلوب." };
  }
  if (!data.full_text?.trim()) {
    return { ok: false, error: "النصّ الكامل للنظام مطلوب." };
  }

  const { error } = await supabase
    .from("legal_corpus")
    .update({
      title: data.title.trim(),
      document_type: data.document_type?.trim() || null,
      source_authority: data.source_authority?.trim() || null,
      specialty_id: data.specialty_id || null,
      full_text: data.full_text.trim(),
      summary: data.summary?.trim() || null,
      reference_number: data.reference_number?.trim() || null,
      issue_date: data.issue_date || null,
      effective_date: data.effective_date || null,
      source_url: data.source_url?.trim() || null,
      tags: data.tags && data.tags.length > 0 ? data.tags : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/legal-corpus");
  revalidatePath(`/admin/legal-corpus/${id}`);

  return { ok: true };
}

// ============================================================
// toggleCorpusActive — soft delete / restore
// ============================================================

export async function toggleCorpusActive(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("legal_corpus")
    .update({
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/legal-corpus");

  return { ok: true };
}
