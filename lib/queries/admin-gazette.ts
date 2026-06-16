import { supabaseAdmin } from "@/lib/supabase/admin";

export const GAZETTE_STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المعالجة",
  extracted: "مُستخرَج",
  parsed: "مُحلّل ✓",
  review: "يحتاج مراجعة",
  needs_ocr: "يحتاج OCR",
  failed: "فشل",
};

export type GazetteOverview = {
  total: number;
  pending: number;
  parsed: number;
  review: number;
  needs_ocr: number;
  failed: number;
  events: number;
  pending_links: number;
  instruments: number;
};

export async function getGazetteOverview(): Promise<GazetteOverview> {
  const a = supabaseAdmin;
  const head = { count: "exact" as const, head: true };
  const [total, pending, parsed, review, ocr, failed, events, pendingLinks, instruments] = await Promise.all([
    a.from("gazette_issues").select("*", head),
    a.from("gazette_issues").select("*", head).eq("process_status", "pending"),
    a.from("gazette_issues").select("*", head).eq("process_status", "parsed"),
    a.from("gazette_issues").select("*", head).eq("process_status", "review"),
    a.from("gazette_issues").select("*", head).eq("process_status", "needs_ocr"),
    a.from("gazette_issues").select("*", head).eq("process_status", "failed"),
    a.from("legal_events").select("*", head),
    a.from("legal_events").select("*", head).eq("link_status", "pending_link"),
    a.from("legal_instruments").select("*", head),
  ]);
  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    parsed: parsed.count ?? 0,
    review: review.count ?? 0,
    needs_ocr: ocr.count ?? 0,
    failed: failed.count ?? 0,
    events: events.count ?? 0,
    pending_links: pendingLinks.count ?? 0,
    instruments: instruments.count ?? 0,
  };
}

export type GazetteIssueRow = {
  issue_number: number;
  issue_date_hijri: string | null;
  process_status: string;
  events_count: number;
  extract_char_count: number | null;
  process_error: string | null;
};

export async function listGazetteIssues(): Promise<GazetteIssueRow[]> {
  const { data } = await supabaseAdmin
    .from("gazette_issues")
    .select("issue_number, issue_date_hijri, process_status, events_count, extract_char_count, process_error")
    .order("issue_number", { ascending: true });
  return (data ?? []).map((r) => ({
    issue_number: r.issue_number as number,
    issue_date_hijri: (r.issue_date_hijri as string) ?? null,
    process_status: r.process_status as string,
    events_count: (r.events_count as number) ?? 0,
    extract_char_count: (r.extract_char_count as number) ?? null,
    process_error: (r.process_error as string) ?? null,
  }));
}
