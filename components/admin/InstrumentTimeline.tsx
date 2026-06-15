"use client";

import { useState } from "react";
import { confirmEventLink, unlinkEvent } from "@/lib/actions/admin-instruments";

const EVENT_TYPE_LABEL: Record<string, string> = {
  issued: "صدور",
  amended: "تعديل",
  repealed: "إلغاء",
  executive_regulation: "لائحة تنفيذية",
  rules: "قواعد",
  correction: "تصحيح",
  royal_decree: "مرسوم ملكيّ",
  cabinet_decision: "قرار مجلس الوزراء",
  ministerial_decision: "قرار وزاريّ",
  other: "حدث",
};

const KIND_LABEL: Record<string, string> = {
  system: "نظام",
  executive_regulation: "لائحة تنفيذية",
  rules: "قواعد",
  agreement: "اتفاقية",
  arrangement: "ترتيب تنظيميّ",
  royal_order: "أمر ملكيّ",
  other: "أخرى",
};

const STATUS_LABEL: Record<string, string> = {
  in_force: "نافذ",
  amended: "مُعدّل",
  repealed: "مُلغى",
  superseded: "محلّ آخر",
  unknown: "غير محدّد",
};

const LINK_LABEL: Record<string, { label: string; color: string }> = {
  confirmed: { label: "ربط مؤكّد", color: "#4ade80" },
  pending_link: { label: "بانتظار تأكيد الربط", color: "#fbbf24" },
  unlinked: { label: "غير مربوط", color: "#8892b0" },
};

export type TimelineEvent = {
  id: string;
  event_type: string;
  instrument_number: string | null;
  authority: string | null;
  event_date_hijri: string | null;
  event_sort: number | null;
  title: string | null;
  affected_articles: string | null;
  raw_text: string;
  link_status: string;
  link_confidence: string | null;
  link_candidate_note: string | null;
  gazette_issue_number: string | null;
  gazette_date_hijri: string | null;
};

export type InstrumentDetail = {
  id: string;
  canonical_title: string;
  instrument_kind: string;
  specialty_name: string | null;
  first_reference_number: string | null;
  first_issue_date_hijri: string | null;
  status: string;
  summary: string | null;
  events: TimelineEvent[];
};

// يبني محتوى ملفّ النظام (الرأس + كلّ الأحداث الأقدم→الأحدث) — النصّ حرفيّ
function buildDocument(d: InstrumentDetail, md: boolean): string {
  const L: string[] = [];
  const h1 = md ? "# " : "";
  const h2 = md ? "## " : "";
  const h3 = md ? "### " : "";
  const hr = md ? "\n---\n" : "\n" + "=".repeat(60) + "\n";

  L.push(`${h1}${d.canonical_title}`);
  L.push("");
  L.push(`النوع: ${KIND_LABEL[d.instrument_kind] ?? d.instrument_kind}`);
  if (d.specialty_name) L.push(`المجال: ${d.specialty_name}`);
  if (d.first_reference_number) L.push(`رقم المرجع الأوّل: ${d.first_reference_number}`);
  if (d.first_issue_date_hijri) L.push(`أوّل صدور: ${d.first_issue_date_hijri}`);
  L.push(`الحالة: ${STATUS_LABEL[d.status] ?? d.status}`);
  L.push(hr);
  L.push(`${h2}التسلسل الزمنيّ (الأقدم → الأحدث)`);
  L.push("");

  d.events.forEach((e, i) => {
    const type = EVENT_TYPE_LABEL[e.event_type] ?? e.event_type;
    const num = e.instrument_number ? ` رقم ${e.instrument_number}` : "";
    const date = e.event_date_hijri ? ` — ${e.event_date_hijri}` : "";
    L.push(`${h3}[${i + 1}] ${type}${num}${date}`);
    if (e.authority) L.push(`الجهة: ${e.authority}`);
    if (e.affected_articles) L.push(`المواد المتأثّرة: ${e.affected_articles}`);
    if (e.gazette_issue_number)
      L.push(`المصدر: أم القرى — العدد ${e.gazette_issue_number}${e.gazette_date_hijri ? ` (${e.gazette_date_hijri})` : ""}`);
    L.push("");
    L.push(e.raw_text); // ★ النصّ الحرفيّ — كما نُشر
    L.push(hr);
  });

  return L.join("\n");
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeName(t: string): string {
  return t.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_").slice(0, 80);
}

export function InstrumentTimeline({ detail }: { detail: InstrumentDetail }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function copyAll() {
    await navigator.clipboard.writeText(buildDocument(detail, false));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyOne(text: string) {
    await navigator.clipboard.writeText(text);
    setMsg("نُسخ النصّ ✓");
    setTimeout(() => setMsg(null), 1500);
  }

  async function doConfirm(eventId: string) {
    setBusy(eventId);
    const res = await confirmEventLink(eventId, detail.id);
    setBusy(null);
    setMsg(res.ok ? "تمّ تأكيد الربط ✓ — حدّث الصفحة" : res.error ?? "خطأ");
  }

  async function doUnlink(eventId: string) {
    setBusy(eventId);
    const res = await unlinkEvent(eventId);
    setBusy(null);
    setMsg(res.ok ? "تمّ فكّ الربط — حدّث الصفحة" : res.error ?? "خطأ");
  }

  const btn =
    "rounded-lg border border-[#1d3461] bg-[#152a4a] px-3 py-1.5 text-xs text-[#e6f1ff] transition-colors hover:border-[#fbbf24]/60";

  return (
    <div className="space-y-5">
      {/* أزرار التحميل والنسخ */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => download(`${safeName(detail.canonical_title)}.md`, buildDocument(detail, true))} className={btn}>
          ⬇ تحميل Markdown
        </button>
        <button onClick={() => download(`${safeName(detail.canonical_title)}.txt`, buildDocument(detail, false))} className={btn}>
          ⬇ تحميل نصّ (txt)
        </button>
        <button onClick={copyAll} className={btn}>
          {copied ? "نُسخ كامل النظام ✓" : "نسخ كامل النظام"}
        </button>
        {msg && <span className="text-xs text-[#8892b0]">{msg}</span>}
      </div>

      {detail.events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1d3461] bg-[#0f1f3d] p-8 text-center text-[#8892b0]">
          لا أحداث مسجّلة لهذا النظام بعد.
        </div>
      ) : (
        <ol className="relative space-y-4 border-r border-[#1d3461] pr-5">
          {detail.events.map((e, i) => {
            const link = LINK_LABEL[e.link_status] ?? LINK_LABEL.unlinked;
            return (
              <li key={e.id} className="relative">
                <span className="absolute -right-[26px] top-1.5 h-3 w-3 rounded-full border-2 border-[#0a192f] bg-[#4a9eff]" />
                <div className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-[#8892b0]">[{i + 1}]</span>
                      <span className="font-semibold text-[#e6f1ff]">
                        {EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}
                      </span>
                      {e.instrument_number && (
                        <span className="font-mono text-xs text-[#4a9eff]" dir="ltr">{e.instrument_number}</span>
                      )}
                      {e.event_date_hijri && <span className="text-xs text-[#8892b0]">{e.event_date_hijri}</span>}
                    </div>
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ color: link.color, backgroundColor: `${link.color}1a` }}
                    >
                      {link.label}
                      {e.link_confidence ? ` · ${e.link_confidence}` : ""}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                    {e.authority && <span>الجهة: {e.authority}</span>}
                    {e.affected_articles && <span>المواد: {e.affected_articles}</span>}
                    {e.gazette_issue_number && <span>أم القرى — العدد {e.gazette_issue_number}</span>}
                  </div>

                  {e.link_candidate_note && e.link_status === "pending_link" && (
                    <div className="mt-2 rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/10 p-2 text-xs text-[#fbbf24]">
                      اقتراح الربط: {e.link_candidate_note}
                    </div>
                  )}

                  {/* النصّ الحرفيّ */}
                  <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-[#1d3461] bg-[#0a192f] p-3 text-sm leading-7 text-[#e6f1ff]" style={{ fontFamily: "inherit" }}>
{e.raw_text}
                  </pre>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button onClick={() => copyOne(e.raw_text)} className={btn}>نسخ نصّ الحدث</button>
                    {e.link_status !== "confirmed" && (
                      <button onClick={() => doConfirm(e.id)} disabled={busy === e.id} className={btn}>
                        {busy === e.id ? "…" : "تأكيد الربط بهذا النظام"}
                      </button>
                    )}
                    {e.link_status === "confirmed" && (
                      <button onClick={() => doUnlink(e.id)} disabled={busy === e.id} className={btn}>
                        {busy === e.id ? "…" : "فكّ الربط"}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
