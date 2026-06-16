import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractGazetteText } from "./extract";
import { parseIssue, ParsedEvent } from "./parse";

// تطبيع الاسم للمطابقة فقط (لا يُخزَّن) — إزالة التشكيل و«ال» والمسافات الزائدة
function normalizeTitle(t: string): string {
  return t
    .replace(/[\u064B-\u065F\u0670]/g, "") // تشكيل
    .replace(/[إأآا]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

type LinkResult = {
  instrument_id: string | null;
  link_status: "confirmed" | "pending_link" | "unlinked";
  link_confidence: "exact" | "probable" | "ambiguous" | null;
  note: string | null;
};

/**
 * يربط حدثًا بنظامه الأمّ:
 * 1) رقم المرجع (بصمة فريدة) → exact
 * 2) الاسم المطبّع → probable
 * 3) غموض/تعدّد → pending_link (لمراجعة المالك)
 * يُنشئ النظام الأمّ إن لم يوجد (للحالات الواضحة فقط).
 */
async function resolveInstrument(ev: ParsedEvent, specialtyId: string | null): Promise<LinkResult> {
  const a = supabaseAdmin;

  // (1) رقم المرجع
  if (ev.parent_reference) {
    const { data: byRef } = await a
      .from("legal_instruments")
      .select("id")
      .or(`first_reference_number.eq.${ev.parent_reference},match_keys.cs.{${ev.parent_reference}}`);

    if (byRef && byRef.length === 1) {
      return { instrument_id: byRef[0].id as string, link_status: "confirmed", link_confidence: "exact", note: null };
    }
    if (byRef && byRef.length > 1) {
      return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous",
        note: `تطابق رقم المرجع ${ev.parent_reference} مع ${byRef.length} أنظمة — يلزم تأكيد يدويّ.` };
    }
    // لا يوجد → أنشئ النظام الأمّ (تعديل على نظام معروف برقمه)
    const title = ev.parent_title ?? `نظام (مرجع ${ev.parent_reference})`;
    const { data: created } = await a
      .from("legal_instruments")
      .insert({
        canonical_title: title,
        instrument_kind: ev.instrument_kind,
        specialty_id: specialtyId,
        first_reference_number: ev.parent_reference,
        match_keys: ev.match_keys,
        status: "amended",
      })
      .select("id")
      .single();
    return { instrument_id: created?.id ?? null, link_status: "confirmed", link_confidence: "exact",
      note: `أُنشئ النظام الأمّ من رقم المرجع ${ev.parent_reference}.` };
  }

  // (2) الاسم المطبّع
  if (ev.parent_title) {
    const norm = normalizeTitle(ev.parent_title);
    const { data: all } = await a.from("legal_instruments").select("id, canonical_title");
    const matches = (all ?? []).filter((r) => normalizeTitle(r.canonical_title as string) === norm);
    if (matches.length === 1) {
      return { instrument_id: matches[0].id as string, link_status: "confirmed", link_confidence: "probable", note: null };
    }
    if (matches.length > 1) {
      return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous",
        note: `تطابق الاسم «${ev.parent_title}» مع ${matches.length} أنظمة — يلزم تأكيد يدويّ.` };
    }
    // جديد → أنشئ النظام (إصدار قائم بذاته)
    const { data: created } = await a
      .from("legal_instruments")
      .insert({
        canonical_title: ev.parent_title,
        instrument_kind: ev.instrument_kind,
        specialty_id: specialtyId,
        match_keys: ev.match_keys,
        status: ev.event_type === "repealed" ? "repealed" : "in_force",
      })
      .select("id")
      .single();
    return { instrument_id: created?.id ?? null, link_status: "confirmed", link_confidence: "probable",
      note: "أُنشئ النظام من الاسم المُستنتَج." };
  }

  // (3) لا مرجع ولا اسم واضح → غير مربوط (لمراجعة المالك)
  return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous",
    note: "تعذّر استنتاج النظام الأمّ تلقائيًّا — يلزم ربط يدويّ." };
}

export type ProcessSummary = {
  issue_number: number;
  status: string;
  events: number;
  pending_links: number;
  error?: string;
};

/** يعالج عددًا واحدًا: استخلاص → تحليل → ربط → تخزين حرفيّ. Idempotent. */
async function processOneIssue(issue: { id: string; issue_number: number; pdf_file_name: string }): Promise<ProcessSummary> {
  const a = supabaseAdmin;

  const ext = await extractGazetteText(issue.pdf_file_name);
  if (!ext.ok) {
    await a.from("gazette_issues").update({ process_status: "failed", process_error: ext.error, processed_at: new Date().toISOString() }).eq("id", issue.id);
    return { issue_number: issue.issue_number, status: "failed", events: 0, pending_links: 0, error: ext.error };
  }

  // تخزين النصّ الكامل حرفيًّا (للتدقيق وإعادة التحليل)
  if (ext.needsOcr) {
    await a.from("gazette_issues").update({
      process_status: "needs_ocr", full_text: ext.text, extract_char_count: ext.charCount,
      process_error: `جودة استخلاص منخفضة (نسبة عربيّة ${(ext.arabicRatio ?? 0).toFixed(2)}) — قد يحتاج OCR.`,
      processed_at: new Date().toISOString(),
    }).eq("id", issue.id);
    return { issue_number: issue.issue_number, status: "needs_ocr", events: 0, pending_links: 0 };
  }

  const parsed = parseIssue(ext.text!);

  // تخصّص العدد غير معروف مسبقًا — نتركه للنظام الأمّ (قد يُحدَّد لاحقًا). نمرّر null.
  // حذف الأحداث الآليّة السابقة لهذا العدد (إعادة معالجة نظيفة)
  await a.from("legal_events").delete().eq("gazette_issue_id", issue.id).eq("extraction_method", "auto_pdf");

  let pendingCount = 0;
  for (const ev of parsed.events) {
    const link = await resolveInstrument(ev, null);
    if (link.link_status === "pending_link") pendingCount++;

    await a.from("legal_events").insert({
      instrument_id: link.instrument_id,
      gazette_issue_id: issue.id,
      event_type: ev.event_type,
      instrument_number: ev.instrument_number,
      authority: ev.authority,
      event_date_hijri: ev.event_date_hijri,
      event_sort: ev.event_sort,
      affected_articles: ev.affected_articles,
      raw_text: ev.raw_text, // ★ حرفيّ
      link_status: link.link_status,
      link_confidence: link.link_confidence,
      link_candidate_note: link.note,
      extraction_method: "auto_pdf",
    });
  }

  const status = parsed.regulatory_section_found ? (parsed.events.length > 0 ? "parsed" : "review") : "review";
  await a.from("gazette_issues").update({
    process_status: status, full_text: ext.text, extract_char_count: ext.charCount,
    events_count: parsed.events.length, process_error: null, processed_at: new Date().toISOString(),
  }).eq("id", issue.id);

  return { issue_number: issue.issue_number, status, events: parsed.events.length, pending_links: pendingCount };
}

/**
 * يعالج الدفعة التالية من الأعداد غير المعالَجة، ضمن ميزانية وقت للطلب الواحد.
 * يُستدعى تكرارًا من لوحة الإدارة حتّى ينتهي كلّ المخزن.
 */
export async function processNextBatch(opts: { limit?: number; budgetMs?: number; reprocess?: boolean } = {}) {
  const limit = opts.limit ?? 3;
  const budgetMs = opts.budgetMs ?? 45000;
  const started = Date.now();
  const a = supabaseAdmin;

  const statusFilter = opts.reprocess ? ["pending", "failed", "review", "needs_ocr"] : ["pending"];
  const { data: issues } = await a
    .from("gazette_issues")
    .select("id, issue_number, pdf_file_name")
    .in("process_status", statusFilter)
    .order("issue_number", { ascending: true })
    .limit(limit);

  const results: ProcessSummary[] = [];
  for (const issue of issues ?? []) {
    if (Date.now() - started > budgetMs) break;
    try {
      results.push(await processOneIssue(issue as { id: string; issue_number: number; pdf_file_name: string }));
    } catch (e) {
      results.push({ issue_number: (issue as { issue_number: number }).issue_number, status: "failed", events: 0, pending_links: 0, error: e instanceof Error ? e.message : "error" });
    }
  }

  // إحصاء متبقّي
  const { count: remaining } = await a
    .from("gazette_issues")
    .select("*", { count: "exact", head: true })
    .eq("process_status", "pending");

  return {
    ok: true,
    processed: results.length,
    remaining: remaining ?? 0,
    elapsed_ms: Date.now() - started,
    results,
  };
}
