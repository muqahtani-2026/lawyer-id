import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractGazetteText } from "./extract";
import { parseIssue, ParsedEvent } from "./parse";

function normalizeTitle(t: string): string {
  return t
    .replace(/[\u064B-\u065F\u0670]/g, "")
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

async function resolveInstrument(ev: ParsedEvent, specialtyId: string | null, errs: string[]): Promise<LinkResult> {
  const a = supabaseAdmin;

  if (ev.parent_reference) {
    const { data: byRefExact, error: e1 } = await a
      .from("legal_instruments").select("id").eq("first_reference_number", ev.parent_reference);
    if (e1) errs.push(`select ref: ${e1.message}`);
    const matches = byRefExact ?? [];
    if (matches.length === 1) return { instrument_id: matches[0].id as string, link_status: "confirmed", link_confidence: "exact", note: null };
    if (matches.length > 1) return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous", note: `تطابق رقم المرجع ${ev.parent_reference} مع ${matches.length} أنظمة.` };
    const title = ev.parent_title ?? `نظام (مرجع ${ev.parent_reference})`;
    const { data: created, error: e2 } = await a.from("legal_instruments")
      .insert({ canonical_title: title, instrument_kind: ev.instrument_kind, specialty_id: specialtyId, first_reference_number: ev.parent_reference, match_keys: ev.match_keys, status: "amended" })
      .select("id").single();
    if (e2) { errs.push(`insert instrument(ref): ${e2.message}`); return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous", note: "تعذّر إنشاء النظام." }; }
    return { instrument_id: created?.id ?? null, link_status: "confirmed", link_confidence: "exact", note: `أُنشئ من رقم المرجع ${ev.parent_reference}.` };
  }

  if (ev.parent_title) {
    const norm = normalizeTitle(ev.parent_title);
    const { data: all, error: e3 } = await a.from("legal_instruments").select("id, canonical_title");
    if (e3) errs.push(`select title: ${e3.message}`);
    const matches = (all ?? []).filter((r) => normalizeTitle(r.canonical_title as string) === norm);
    if (matches.length === 1) return { instrument_id: matches[0].id as string, link_status: "confirmed", link_confidence: "probable", note: null };
    if (matches.length > 1) return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous", note: `تطابق الاسم مع ${matches.length} أنظمة.` };
    const { data: created, error: e4 } = await a.from("legal_instruments")
      .insert({ canonical_title: ev.parent_title, instrument_kind: ev.instrument_kind, specialty_id: specialtyId, match_keys: ev.match_keys, status: ev.event_type === "repealed" ? "repealed" : "in_force" })
      .select("id").single();
    if (e4) { errs.push(`insert instrument(title): ${e4.message}`); return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous", note: "تعذّر إنشاء النظام." }; }
    return { instrument_id: created?.id ?? null, link_status: "confirmed", link_confidence: "probable", note: "أُنشئ من الاسم المُستنتَج." };
  }

  return { instrument_id: null, link_status: "pending_link", link_confidence: "ambiguous", note: "تعذّر استنتاج النظام الأمّ — يلزم ربط يدويّ." };
}

export type ProcessSummary = { issue_number: number; status: string; events: number; pending_links: number; error?: string };

async function processOneIssue(issue: { id: string; issue_number: number; pdf_file_name: string }): Promise<ProcessSummary> {
  const a = supabaseAdmin;
  const errs: string[] = [];

  const ext = await extractGazetteText(issue.pdf_file_name);
  if (!ext.ok) {
    await a.from("gazette_issues").update({ process_status: "failed", process_error: ext.error, processed_at: new Date().toISOString() }).eq("id", issue.id);
    return { issue_number: issue.issue_number, status: "failed", events: 0, pending_links: 0, error: ext.error };
  }

  if (ext.needsOcr) {
    const { error } = await a.from("gazette_issues").update({
      process_status: "needs_ocr", full_text: ext.text, extract_char_count: ext.charCount,
      process_error: `جودة استخلاص منخفضة (نسبة عربيّة ${(ext.arabicRatio ?? 0).toFixed(2)}).`, processed_at: new Date().toISOString(),
    }).eq("id", issue.id);
    return { issue_number: issue.issue_number, status: "needs_ocr", events: 0, pending_links: 0, error: error?.message };
  }

  const parsed = parseIssue(ext.text!, ext.structuredEvents);

  const { error: delErr } = await a.from("legal_events").delete().eq("gazette_issue_id", issue.id).eq("extraction_method", "auto_pdf");
  if (delErr) errs.push(`delete: ${delErr.message}`);

  let pendingCount = 0;
  let inserted = 0;
  for (const ev of parsed.events) {
    const link = await resolveInstrument(ev, null, errs);
    if (link.link_status === "pending_link") pendingCount++;
    const { error: insErr } = await a.from("legal_events").insert({
      instrument_id: link.instrument_id, gazette_issue_id: issue.id, event_type: ev.event_type,
      instrument_number: ev.instrument_number, authority: ev.authority, event_date_hijri: ev.event_date_hijri,
      event_sort: ev.event_sort, affected_articles: ev.affected_articles, raw_text: ev.raw_text,
      link_status: link.link_status, link_confidence: link.link_confidence, link_candidate_note: link.note, extraction_method: "auto_pdf",
    });
    if (insErr) errs.push(`insert event: ${insErr.message}`);
    else inserted++;
  }

  if (parsed.events.length > 0 && inserted === 0) {
    await a.from("gazette_issues").update({ process_status: "failed", process_error: errs.slice(0, 3).join(" | "), processed_at: new Date().toISOString() }).eq("id", issue.id);
    return { issue_number: issue.issue_number, status: "failed", events: 0, pending_links: 0, error: errs[0] ?? "فشل الإدراج" };
  }

  const status = parsed.regulatory_section_found ? (inserted > 0 ? "parsed" : "review") : "review";
  const { error: upErr } = await a.from("gazette_issues").update({
    process_status: status, full_text: ext.text, extract_char_count: ext.charCount,
    events_count: inserted, process_error: errs.length ? errs.slice(0, 3).join(" | ") : null, processed_at: new Date().toISOString(),
  }).eq("id", issue.id);
  if (upErr) errs.push(`update issue: ${upErr.message}`);

  return { issue_number: issue.issue_number, status, events: inserted, pending_links: pendingCount, error: errs[0] };
}

export async function processNextBatch(opts: { limit?: number; budgetMs?: number; reprocess?: boolean; issueNumber?: number } = {}) {
  const limit = opts.limit ?? 3;
  const budgetMs = opts.budgetMs ?? 45000;
  const started = Date.now();
  const a = supabaseAdmin;

  // وضع التجربة: معالجة عدد واحد محدّد بالرقم (يتجاوز فلتر الحالة) — للاختبار الآمن.
  let issues: Array<{ id: string; issue_number: number; pdf_file_name: string }> | null = null;
  let listErr: { message: string } | null = null;
  if (opts.issueNumber != null) {
    const r = await a
      .from("gazette_issues").select("id, issue_number, pdf_file_name")
      .eq("issue_number", opts.issueNumber).limit(1);
    issues = r.data as typeof issues;
    listErr = r.error;
  } else {
    const statusFilter = opts.reprocess ? ["pending", "failed", "review", "needs_ocr"] : ["pending"];
    const r = await a
      .from("gazette_issues").select("id, issue_number, pdf_file_name")
      .in("process_status", statusFilter).order("issue_number", { ascending: true }).limit(limit);
    issues = r.data as typeof issues;
    listErr = r.error;
  }
  if (listErr) return { ok: false, error: `list: ${listErr.message}`, processed: 0, remaining: -1, results: [] as ProcessSummary[] };

  const results: ProcessSummary[] = [];
  for (const issue of issues ?? []) {
    if (Date.now() - started > budgetMs) break;
    try {
      results.push(await processOneIssue(issue as { id: string; issue_number: number; pdf_file_name: string }));
    } catch (e) {
      results.push({ issue_number: (issue as { issue_number: number }).issue_number, status: "failed", events: 0, pending_links: 0, error: e instanceof Error ? e.message : "error" });
    }
  }

  const { count: remaining } = await a.from("gazette_issues").select("*", { count: "exact", head: true }).eq("process_status", "pending");
  return { ok: true, processed: results.length, remaining: remaining ?? 0, elapsed_ms: Date.now() - started, results };
}
