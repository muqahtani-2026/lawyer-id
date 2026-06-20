"use client";

import { useState } from "react";
import type { L3InstrumentDetail, L3TimelineEvent, L3Article } from "@/lib/queries/admin-l3";

const KIND_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  issued: { label: "إصدار أصليّ", bg: "rgba(52,211,153,0.15)", fg: "#34d399" },
  amended: { label: "تعديل", bg: "rgba(251,191,36,0.15)", fg: "#fbbf24" },
  executive: { label: "لائحة تنفيذية", bg: "rgba(96,165,250,0.15)", fg: "#60a5fa" },
  repealed: { label: "إلغاء", bg: "rgba(248,113,113,0.15)", fg: "#f87171" },
  mention: { label: "ذكر", bg: "rgba(136,146,176,0.15)", fg: "#8892b0" },
};

function parseArticles(s: string | null): string[] {
  if (!s) return [];
  return s.split(/[،,]/).map((x) => x.trim()).filter(Boolean).slice(0, 60);
}

export function L3InstrumentView({ detail }: { detail: L3InstrumentDetail }) {
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const events = detail.events;
  const hasFullText = detail.articles.length > 0;
  const hasRawFullText = !!detail.full_text && detail.full_text.length > 100;

  // مجموع المواد المعدّلة عبر كلّ التعديلات (للتلوين في النصّ الكامل)
  const amendedArticles = new Set<string>();
  events.forEach((e) => parseArticles(e.affected_articles).forEach((a) => amendedArticles.add(a)));

  return (
    <div className="space-y-6">
      {/* ── النصّ الكامل (إن توفّر) ── */}
      <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content">النصّ النظاميّ النافذ</h2>
          <span className="font-mono text-xs text-[#8892b0]">
            {hasFullText ? `${detail.articles.length} مادة` : hasRawFullText ? "النصّ الكامل" : "غير متوفّر بعد"}
          </span>
        </div>

        {hasFullText ? (
          <div className="space-y-3">
            {detail.articles.map((art) => {
              const isAmended = art.status === "amended" || amendedArticles.has(art.article_number);
              return (
                <div
                  key={art.article_number}
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: isAmended ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)",
                    background: isAmended ? "rgba(251,191,36,0.06)" : "transparent",
                  }}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-[#fbbf24]">المادة {art.article_number}</span>
                    {isAmended && (
                      <span className="rounded bg-[#fbbf24]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#fbbf24]">
                        معدّلة
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-7 text-content/90">
                    {art.article_text ?? "—"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : hasRawFullText ? (
          <div>
            <p className="mb-3 font-mono text-xs text-[#8892b0]">
              النصّ الكامل للنظام (من هيئة الخبراء). المواد المذكورة في التعديلات أدناه:
              {[...amendedArticles].sort((a, b) => +a - +b).slice(0, 30).join("، ") || " —"}
            </p>
            <div className="max-h-[600px] overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="whitespace-pre-wrap text-sm leading-8 text-content/90">
                {detail.full_text}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.01] p-4">
            <p className="text-sm leading-7 text-muted">
              النصّ الموحّد الكامل لمواد هذا النظام لم يُجلب بعد. سيُملأ عند جلب النصّ الموحّد من
              المصدر الرسميّ، وستُلوّن المواد المعدّلة فيه.
            </p>
            <p className="mt-2 font-mono text-xs text-[#8892b0]">
              المواد المعدّلة عبر التسلسل أدناه: {[...amendedArticles].sort((a, b) => +a - +b).slice(0, 30).join("، ") || "—"}
            </p>
          </div>
        )}
      </section>

      {/* ── التسلسل الزمنيّ ── */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-content">
          التسلسل الزمنيّ للتعديلات
          <span className="mr-2 font-mono text-xs font-normal text-[#8892b0]">
            ({events.length} حدثًا · الأقدم ← الأحدث)
          </span>
        </h2>

        <div className="space-y-3 border-r-2 border-white/10 pr-4">
          {events.map((ev, i) => {
            const badge = KIND_BADGE[ev.link_kind] ?? KIND_BADGE.mention;
            const isLast = i === events.length - 1;
            const arts = parseArticles(ev.affected_articles);
            const open = openEvent === ev.event_id;
            return (
              <div key={ev.event_id} className="relative">
                <span
                  className="absolute -right-[21px] top-2 h-3 w-3 rounded-full"
                  style={{ background: isLast ? "#60a5fa" : badge.fg }}
                />
                <button
                  onClick={() => setOpenEvent(open ? null : ev.event_id)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-3 text-right transition hover:border-white/20"
                  style={isLast ? { borderColor: "rgba(96,165,250,0.4)", background: "rgba(96,165,250,0.05)" } : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded px-2 py-0.5 font-mono text-[11px]" style={{ background: badge.bg, color: badge.fg }}>
                      {isLast ? "أحدث نسخة" : badge.label}
                    </span>
                    <span className="text-sm font-medium text-content">
                      {ev.decision_number ? `رقم ${ev.decision_number}` : "—"}
                    </span>
                    {ev.refined && ev.is_real && (
                      <span className="font-mono text-[10px] text-[#34d399]">✓ مدقّق</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[#8892b0]">
                    {ev.gazette_issue && <span>العدد {ev.gazette_issue}</span>}
                    {ev.event_date && <span>· {ev.event_date}</span>}
                    {ev.authority && <span>· {ev.authority}</span>}
                  </div>
                  {arts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="font-mono text-[11px] text-[#8892b0]">المواد المعدّلة:</span>
                      {arts.map((a) => (
                        <span key={a} className="rounded bg-[#fbbf24]/15 px-1.5 py-0.5 font-mono text-[11px] text-[#fbbf24]">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                  {ev.summary && <p className="mt-2 text-right text-xs leading-6 text-content/80">{ev.summary}</p>}
                </button>

                {open && (
                  <div className="mt-1 rounded-lg border border-white/10 bg-black/30 p-3">
                    <p className="mb-1 font-mono text-[10px] text-[#8892b0]">النصّ الحرفيّ (مقتطف):</p>
                    <p className="whitespace-pre-wrap text-xs leading-6 text-content/70">{ev.text_excerpt}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
