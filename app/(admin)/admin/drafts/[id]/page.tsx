import { notFound } from "next/navigation";
import Link from "next/link";
import { getDraftDetail } from "@/lib/queries/admin-drafts";

const GOLD = "#fbbf24";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "#fbbf24" },
  approved: { label: "مُعتمدة", color: "#4ade80" },
  rejected: { label: "مرفوضة", color: "#ef4444" },
  published: { label: "منشورة", color: "#a78bfa" },
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "X / Twitter",
  blog: "Blog",
  linkedin: "LinkedIn",
};

export default async function AdminDraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getDraftDetail(id);

  if (!detail) notFound();

  const status = STATUS_META[detail.draft.status] ?? {
    label: detail.draft.status,
    color: "#8892b0",
  };

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto" style={{ direction: "rtl" }}>
      {/* Back */}
      <Link
        href="/admin/drafts"
        className="inline-flex items-center gap-2 text-xs font-mono tracking-wider text-[#8892b0] hover:text-[#fbbf24] mb-6 transition-colors"
      >
        <span>←</span>
        <span>العودة لقائمة المسوّدات</span>
      </Link>

      {/* Header */}
      <header className="mb-8 pb-6 border-b border-[#1d3461]">
        <div className="flex items-baseline gap-3 mb-3">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: GOLD }}
          >
            ADMIN · DRAFT
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            {id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Status pill + meta row */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <span
            className="text-xs px-2.5 py-1 rounded font-mono font-bold tracking-wider"
            style={{
              backgroundColor: `${status.color}20`,
              color: status.color,
            }}
          >
            {status.label}
          </span>
          {detail.draft.quality_score !== null && (
            <span className="text-xs font-mono text-[#8892b0]">
              الجودة:{" "}
              <span
                className="font-bold"
                style={{ color: qualityColor(detail.draft.quality_score) }}
              >
                {detail.draft.quality_score}/100
              </span>
            </span>
          )}
          <span className="text-xs font-mono text-[#8892b0]">·</span>
          <span className="text-xs font-mono text-[#8892b0]">
            {PLATFORM_LABELS[detail.draft.draft_platform] ??
              detail.draft.draft_platform}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-snug">
          {detail.draft.draft_title ?? (
            <span className="text-[#8892b0]">بدون عنوان</span>
          )}
        </h1>

        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-[#8892b0]">المحامي:</span>
          <Link
            href={`/admin/lawyers/${detail.lawyer.id}`}
            className="hover:underline transition-colors"
            style={{ color: GOLD }}
          >
            {detail.lawyer.full_name ?? "—"}
          </Link>
          <span className="text-[#8892b0]">·</span>
          <span className="text-[#8892b0] font-mono text-xs">
            {detail.lawyer.email}
          </span>
          {detail.specialty && (
            <>
              <span className="text-[#8892b0]">·</span>
              <span className="text-[#e6f1ff] text-xs">
                {detail.specialty.name_ar}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Summary */}
      {detail.draft.draft_summary && (
        <Card className="mb-4">
          <SectionTitle>SUMMARY</SectionTitle>
          <p className="text-sm leading-relaxed text-[#e6f1ff]">
            {detail.draft.draft_summary}
          </p>
        </Card>
      )}

      {/* Content (main) */}
      <Card className="mb-4">
        <SectionTitle>CONTENT</SectionTitle>
        <div className="text-sm leading-loose text-[#e6f1ff] whitespace-pre-wrap">
          {detail.draft.draft_content}
        </div>
      </Card>

      {/* Classification + Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <SectionTitle>CLASSIFICATION</SectionTitle>
          <div className="space-y-4">
            <Field
              label="التخصّص"
              value={detail.specialty?.name_ar ?? "—"}
            />
            {detail.draft.legal_branch && (
              <Field
                label="الفرع القانونيّ"
                value={detail.draft.legal_branch}
              />
            )}
            {detail.draft.classification_confidence !== null && (
              <Field
                label="ثقة التصنيف"
                value={
                  <span className="font-mono">
                    {(detail.draft.classification_confidence * 100).toFixed(
                      0
                    )}
                    %
                  </span>
                }
              />
            )}
            {detail.draft.tags && detail.draft.tags.length > 0 && (
              <div>
                <FieldLabel>الوسوم</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {detail.draft.tags.map((t, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-[#152a4a] border border-[#1d3461]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle>SOURCE</SectionTitle>
          <div className="space-y-4">
            {detail.source_legal ? (
              <Field
                label="النظام المرجعيّ"
                value={
                  <span>
                    {detail.source_legal.title}
                    {detail.source_legal.reference_number && (
                      <span className="text-[#8892b0] font-mono text-xs ms-1">
                        ({detail.source_legal.reference_number})
                      </span>
                    )}
                  </span>
                }
              />
            ) : (
              <Field label="النظام المرجعيّ" value="—" />
            )}
            {detail.draft.source_title && (
              <Field
                label="عنوان المصدر الخارجيّ"
                value={detail.draft.source_title}
              />
            )}
            {detail.draft.source_url && (
              <Field
                label="رابط المصدر"
                value={
                  <a
                    href={detail.draft.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline truncate block text-xs font-mono"
                    style={{ color: "#4a9eff" }}
                  >
                    {detail.draft.source_url}
                  </a>
                }
              />
            )}
          </div>
        </Card>
      </div>

      {/* Regulatory References */}
      {detail.draft.regulatory_references &&
        detail.draft.regulatory_references.length > 0 && (
          <Card className="mb-4">
            <SectionTitle>REGULATORY REFERENCES</SectionTitle>
            <ul className="space-y-2">
              {detail.draft.regulatory_references.map((ref, i) => (
                <li
                  key={i}
                  className="text-sm text-[#e6f1ff] flex items-start gap-2"
                >
                  <span style={{ color: GOLD }} className="mt-1">
                    §
                  </span>
                  <span>{ref}</span>
                </li>
              ))}
            </ul>
            {detail.draft.references_verified !== null && (
              <div className="mt-4 text-xs">
                {detail.draft.references_verified ? (
                  <span style={{ color: "#4ade80" }}>
                    ✓ تمّ التحقّق من المراجع
                  </span>
                ) : (
                  <span style={{ color: "#fbbf24" }}>
                    ⚠ لم يتمّ التحقّق
                  </span>
                )}
              </div>
            )}
          </Card>
        )}

      {/* Rejection Reason */}
      {detail.draft.status === "rejected" &&
        detail.draft.rejection_reason && (
          <div
            className="bg-[#0f1f3d] rounded-xl p-6 mb-4 border"
            style={{ borderColor: "#ef444466" }}
          >
            <h3
              className="text-xs font-mono tracking-[1.5px] mb-4"
              style={{ color: "#ef4444" }}
            >
              REJECTION REASON
            </h3>
            <p className="text-sm text-[#e6f1ff] leading-relaxed">
              {detail.draft.rejection_reason}
            </p>
          </div>
        )}

      {/* Timeline */}
      <Card>
        <SectionTitle>TIMELINE</SectionTitle>
        <ul className="space-y-2 text-sm">
          {detail.draft.generated_at && (
            <TimelineItem
              label="تمّ التوليد"
              date={detail.draft.generated_at}
            />
          )}
          <TimelineItem label="أُنشئ" date={detail.draft.created_at} />
          {detail.draft.sent_to_telegram_at && (
            <TimelineItem
              label="أُرسل لـ Telegram"
              date={detail.draft.sent_to_telegram_at}
              color="#4a9eff"
            />
          )}
          {detail.draft.sent_to_email_at && (
            <TimelineItem
              label="أُرسل لـ Email"
              date={detail.draft.sent_to_email_at}
              color="#a78bfa"
            />
          )}
          {detail.draft.reviewed_at && (
            <TimelineItem
              label="تمّت المراجعة"
              date={detail.draft.reviewed_at}
            />
          )}
          {detail.draft.approved_at && (
            <TimelineItem
              label="تمّ الاعتماد"
              date={detail.draft.approved_at}
              color="#4ade80"
            />
          )}
          {detail.draft.published_at && (
            <TimelineItem
              label="تمّ النشر"
              date={detail.draft.published_at}
              color="#a78bfa"
            />
          )}
        </ul>
      </Card>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-mono tracking-[1.5px] mb-4"
      style={{ color: GOLD }}
    >
      {children}
    </h3>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-[#8892b0] mb-1.5 font-mono">
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="text-sm text-[#e6f1ff]">{value ?? "—"}</div>
    </div>
  );
}

function TimelineItem({
  label,
  date,
  color,
}: {
  label: string;
  date: string;
  color?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 border-b border-[#1d3461]/30 last:border-b-0">
      <span
        className="text-sm"
        style={{ color: color ?? "#e6f1ff" }}
      >
        {label}
      </span>
      <span className="font-mono text-xs text-[#8892b0]" dir="ltr">
        {formatDateTime(date)}
      </span>
    </li>
  );
}

// ============================================================
// Helpers
// ============================================================

function qualityColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#fbbf24";
  return "#ef4444";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}
