"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  approveDraft,
  rejectDraft,
  updateDraft,
  publishDraft,
} from "@/lib/actions/drafts";
import { publishDraftToX } from "@/lib/actions/x-publish";
import { publishDraftToLinkedIn } from "@/lib/actions/linkedin-publish";
import { scheduleDraft, unscheduleDraft } from "@/lib/actions/schedule";
import type { DraftFull } from "@/lib/queries/review";
import { RatingWidget } from "@/components/review/RatingWidget";

// ============================================================
// Helpers
// ============================================================

function formatAbsoluteDate(iso: string): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat("ar", {
      calendar: "gregory",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatRiyadhTime(iso: string): string {
  const date = new Date(iso);
  try {
    return new Intl.DateTimeFormat("ar", {
      calendar: "gregory",
      timeZone: "Asia/Riyadh",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `قبل ${days} يوم`;
}

/** قيمة افتراضيّة لحقل datetime-local: بعد ساعة من الآن (بتوقيت المتصفّح). */
function defaultScheduleValue(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-[#3a2a0a] text-[#fbbf24] border-[#fbbf24]/30",
  approved: "bg-[#0a3a1a] text-[#4ade80] border-[#4ade80]/30",
  rejected: "bg-[#3a0a0a] text-[#ef4444] border-[#ef4444]/30",
  published: "bg-[#152a4a] text-[#4a9eff] border-[#4a9eff]/30",
};

const statusLabels: Record<string, string> = {
  pending: "بانتظار المراجعة",
  approved: "مقبولة",
  rejected: "مرفوضة",
  published: "منشورة",
};

// ============================================================
// Main Component
// ============================================================

export function DraftDetailClient({
  draft,
  isPro = false,
  xConnected = false,
  liConnected = false,
  isXFormat = false,
  isLiFormat = false,
  xAlreadyPublished = false,
  scheduledFor = null,
}: {
  draft: DraftFull;
  isPro?: boolean;
  xConnected?: boolean;
  liConnected?: boolean;
  isXFormat?: boolean;
  isLiFormat?: boolean;
  xAlreadyPublished?: boolean;
  scheduledFor?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // View/Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(draft.draft_title ?? "");
  const [editSummary, setEditSummary] = useState(draft.draft_summary ?? "");
  const [editContent, setEditContent] = useState(draft.draft_content);

  // Reject dialog state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Schedule dialog state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(defaultScheduleValue());

  // Action feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showFeedback = (result: { success: boolean; error?: string }, successMsg: string) => {
    if (result.success) {
      setSuccess(successMsg);
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } else {
      setError(result.error ?? "خطأ غير متوقَّع");
      setSuccess(null);
    }
  };

  // Action handlers
  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveDraft(draft.id);
      showFeedback(result, "تمّت الموافقة بنجاح.");
    });
  };

  const handleReject = () => {
    setError(null);
    startTransition(async () => {
      const result = await rejectDraft(draft.id, rejectReason);
      if (result.success) {
        setIsRejecting(false);
        setRejectReason("");
      }
      showFeedback(result, "تمّ رفض المسوّدة.");
    });
  };

  const handlePublish = () => {
    setError(null);
    startTransition(async () => {
      const result = await publishDraft(draft.id);
      showFeedback(result, "تمّ نشر المسوّدة.");
    });
  };

  // نشر فوريّ إلى X (Pro)
  const handlePublishX = () => {
    setError(null);
    startTransition(async () => {
      const result = await publishDraftToX(draft.id);
      if (result.ok) {
        setSuccess("تمّ النشر على X بنجاح ✅");
        setError(null);
        setTimeout(() => setSuccess(null), 4000);
        router.refresh();
      } else {
        setError(result.error ?? "تعذّر النشر على X.");
        setSuccess(null);
      }
    });
  };

  // نشر فوريّ إلى LinkedIn (Pro)
  const handlePublishLinkedIn = () => {
    setError(null);
    startTransition(async () => {
      const result = await publishDraftToLinkedIn(draft.id);
      if (result.ok) {
        setSuccess("تمّ النشر على LinkedIn بنجاح ✅");
        setError(null);
        setTimeout(() => setSuccess(null), 4000);
        router.refresh();
      } else {
        setError(result.error ?? "تعذّر النشر على LinkedIn.");
        setSuccess(null);
      }
    });
  };

  // جدولة النشر على X (Pro)
  const handleSchedule = () => {
    setError(null);
    startTransition(async () => {
      const iso = new Date(scheduleTime).toISOString();
      const result = await scheduleDraft(draft.id, iso);
      if (result.ok) {
        setIsScheduling(false);
        setSuccess("تمّت الجدولة — ستُنشر في الوقت المحدّد 📅");
        setError(null);
        setTimeout(() => setSuccess(null), 4000);
        router.refresh();
      } else {
        setError(result.error ?? "تعذّرت الجدولة.");
        setSuccess(null);
      }
    });
  };

  const handleUnschedule = () => {
    setError(null);
    startTransition(async () => {
      const result = await unscheduleDraft(draft.id);
      if (result.ok) {
        setSuccess("أُلغيت الجدولة.");
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        setError(result.error ?? "تعذّر إلغاء الجدولة.");
        setSuccess(null);
      }
    });
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await updateDraft(draft.id, {
        draft_title: editTitle,
        draft_summary: editSummary,
        draft_content: editContent,
      });
      if (result.success) {
        setIsEditing(false);
      }
      showFeedback(result, "تمّ حفظ التعديلات.");
    });
  };

  const handleCancelEdit = () => {
    setEditTitle(draft.draft_title ?? "");
    setEditSummary(draft.draft_summary ?? "");
    setEditContent(draft.draft_content);
    setIsEditing(false);
  };

  const statusKey = draft.status in statusBadgeStyles ? draft.status : "pending";
  const displayTitle = draft.draft_title ?? draft.source_title ?? "بدون عنوان";

  // هل تتوفّر شروط النشر على X؟ (مقبولة + x_short + Pro + غير منشورة على X)
  const xEligible =
    draft.status === "approved" && isXFormat && isPro && !xAlreadyPublished;

  // هل تتوفّر شروط النشر على LinkedIn؟ (مقبولة + linkedin_medium + Pro + غير منشورة)
  const liEligible =
    draft.status === "approved" && isLiFormat && isPro && !xAlreadyPublished;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header — back link + status */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/review"
          className="inline-flex items-center gap-2 text-sm text-[#8892b0] hover:text-[#4a9eff] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
          العودة للقائمة
        </Link>
        <span className={cn("text-xs px-2.5 py-1 rounded border", statusBadgeStyles[statusKey])}>
          {statusLabels[statusKey] ?? draft.status}
        </span>
      </div>

      {/* Feedback bar */}
      {(error || success) && (
        <div
          className={cn(
            "p-3 rounded-md border text-sm",
            error
              ? "bg-[#3a0a0a] border-[#ef4444]/30 text-[#ef4444]"
              : "bg-[#0a3a1a] border-[#4ade80]/30 text-[#4ade80]"
          )}
        >
          {error ?? success}
        </div>
      )}

      {/* شارة الجدولة */}
      {scheduledFor && !xAlreadyPublished && (
        <div className="p-3 rounded-md border bg-[#152a4a] border-[#4a9eff]/30 text-sm text-[#e6f1ff] flex items-center justify-between gap-3 flex-wrap">
          <span className="inline-flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            مجدوَلة للنشر على X: <strong>{formatRiyadhTime(scheduledFor)}</strong>
            <span className="text-xs text-[#8892b0]">(توقيت الرياض)</span>
          </span>
          <button
            onClick={handleUnschedule}
            disabled={isPending}
            className="px-3 py-1.5 bg-[#0f1f3d] hover:bg-[#1d3461] border border-[#1d3461] text-[#8892b0] hover:text-[#e6f1ff] text-xs rounded-md transition-colors"
          >
            {isPending ? "..." : "إلغاء الجدولة"}
          </button>
        </div>
      )}

      {/* Main card */}
      <article className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-6 md:p-8 space-y-6">
        {/* Title + Summary */}
        {isEditing ? (
          <>
            <div>
              <label className="block text-xs text-[#8892b0] mb-1.5">العنوان</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-base outline-none transition-colors"
                style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
              />
            </div>
            <div>
              <label className="block text-xs text-[#8892b0] mb-1.5">الملخّص</label>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={2}
                disabled={isPending}
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none leading-relaxed"
              />
            </div>
          </>
        ) : (
          <header>
            <h1
              className="text-2xl md:text-3xl font-bold text-[#e6f1ff] mb-3 leading-tight"
              style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
            >
              {displayTitle}
            </h1>
            {draft.draft_summary && (
              <p className="text-sm text-[#8892b0] leading-relaxed">{draft.draft_summary}</p>
            )}
          </header>
        )}

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-xs text-[#8892b0] pb-4 border-b border-[#1d3461]">
          <span title={formatAbsoluteDate(draft.created_at)}>
            أُنشئت {formatRelativeTime(draft.created_at)}
          </span>
          {draft.quality_score !== null && (
            <span className="text-[#4a9eff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              جودة: {draft.quality_score}
            </span>
          )}
          {draft.legal_branch && (
            <span className="px-2 py-0.5 bg-[#152a4a] rounded">{draft.legal_branch}</span>
          )}
          {draft.draft_platform && (
            <span className="px-2 py-0.5 bg-[#152a4a] rounded">{draft.draft_platform}</span>
          )}
          {draft.references_verified && (
            <span className="text-[#4ade80] inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              مراجع موثَّقة
            </span>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div>
            <label className="block text-xs text-[#8892b0] mb-1.5">المحتوى</label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={14}
              disabled={isPending}
              className="w-full px-4 py-3 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-base outline-none transition-colors resize-none leading-loose"
              style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
            />
          </div>
        ) : (
          <div
            className="text-base text-[#e6f1ff] leading-loose whitespace-pre-wrap"
            style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
          >
            {draft.draft_content}
          </div>
        )}

        {/* Tags */}
        {draft.tags && draft.tags.length > 0 && !isEditing && (
          <div className="pt-4 border-t border-[#1d3461]">
            <div className="text-xs text-[#8892b0] mb-2">الوسوم:</div>
            <div className="flex flex-wrap gap-2">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 bg-[#152a4a] border border-[#1d3461] rounded-full text-[#e6f1ff]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Regulatory references */}
        {draft.regulatory_references && draft.regulatory_references.length > 0 && !isEditing && (
          <div className="pt-4 border-t border-[#1d3461]">
            <div className="text-xs text-[#8892b0] mb-2">المراجع النظاميّة:</div>
            <ul className="space-y-1">
              {draft.regulatory_references.map((ref, idx) => (
                <li key={idx} className="text-sm text-[#e6f1ff] flex items-start gap-2">
                  <span className="text-[#4a9eff] mt-1">•</span>
                  <span>{ref}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Source info */}
        {(draft.source_title || draft.source_url) && !isEditing && (
          <div className="pt-4 border-t border-[#1d3461] bg-[#0a192f]/50 -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 md:px-8 pb-6 md:pb-8 rounded-b-lg">
            <div className="text-xs text-[#8892b0] mb-2">المصدر:</div>
            {draft.source_title && (
              <div className="text-sm text-[#e6f1ff] mb-1">{draft.source_title}</div>
            )}
            {draft.source_url && (
              <a
                href={draft.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#4a9eff] hover:underline break-all"
              >
                {draft.source_url}
              </a>
            )}
            {draft.source_summary && (
              <p className="text-xs text-[#8892b0] mt-2 leading-relaxed">{draft.source_summary}</p>
            )}
          </div>
        )}

        {/* Rejection reason banner */}
        {draft.status === "rejected" && draft.rejection_reason && !isEditing && (
          <div className="p-4 bg-[#3a0a0a] border border-[#ef4444]/30 rounded-md">
            <div className="text-xs text-[#ef4444] mb-1 font-medium">سبب الرفض:</div>
            <p className="text-sm text-[#e6f1ff]">{draft.rejection_reason}</p>
          </div>
        )}
      </article>

      {/* Action bar */}
      <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-4 md:p-5">
        {isRejecting ? (
          <div className="space-y-3">
            <label className="block text-sm text-[#e6f1ff] font-medium">سبب الرفض</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="اشرح سبب رفض المسوّدة (مطلوب)..."
              disabled={isPending}
              className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#ef4444] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#8892b0]">{rejectReason.length} / 500</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectReason("");
                    setError(null);
                  }}
                  disabled={isPending}
                  className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleReject}
                  disabled={isPending || !rejectReason.trim()}
                  className="px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
                >
                  {isPending ? "جاري الرفض..." : "تأكيد الرفض"}
                </button>
              </div>
            </div>
          </div>
        ) : isScheduling ? (
          <div className="space-y-3">
            <label className="block text-sm text-[#e6f1ff] font-medium">
              وقت النشر على X
              <span className="text-xs text-[#8892b0] font-normal mr-2">(بتوقيتك المحليّ)</span>
            </label>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              disabled={isPending}
              className="w-full md:w-auto px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace", colorScheme: "dark" }}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsScheduling(false);
                  setError(null);
                }}
                disabled={isPending}
                className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSchedule}
                disabled={isPending || !scheduleTime}
                className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
              >
                {isPending ? "جاري الجدولة..." : "تأكيد الجدولة"}
              </button>
            </div>
          </div>
        ) : isEditing ? (
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleCancelEdit}
              disabled={isPending}
              className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
            >
              {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Edit available always */}
            <button
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors inline-flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              تعديل
            </button>

            {/* Approve: pending or rejected */}
            {(draft.status === "pending" || draft.status === "rejected") && (
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="px-4 py-2 bg-[#4ade80] hover:bg-[#22c55e] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-[#0a192f] text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isPending ? "..." : "موافقة"}
              </button>
            )}

            {/* Reject: pending or approved */}
            {(draft.status === "pending" || draft.status === "approved") && (
              <button
                onClick={() => setIsRejecting(true)}
                disabled={isPending}
                className="px-4 py-2 bg-[#3a0a0a] hover:bg-[#5a1a1a] border border-[#ef4444]/30 text-[#ef4444] text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                رفض
              </button>
            )}

            {/* Publish: approved only */}
            {draft.status === "approved" && (
              <button
                onClick={handlePublish}
                disabled={isPending}
                className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {isPending ? "..." : "نشر"}
              </button>
            )}

            {/* X actions: approved + x_short + Pro + not already on X */}
            {xEligible &&
              (xConnected ? (
                <>
                  {/* جدولة النشر — يظهر فقط إن لم تكن مجدوَلة */}
                  {!scheduledFor && (
                    <button
                      onClick={() => setIsScheduling(true)}
                      disabled={isPending}
                      className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] border border-[#4a9eff]/30 text-[#4a9eff] text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      جدولة النشر
                    </button>
                  )}

                  {/* نشر فوريّ إلى X */}
                  <button
                    onClick={handlePublishX}
                    disabled={isPending}
                    className="px-4 py-2 bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    {isPending ? "..." : "نشر إلى X"}
                  </button>
                </>
              ) : (
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#8892b0] text-sm rounded-md transition-colors inline-flex items-center gap-2"
                >
                  اربط حساب X أوّلًا
                </Link>
              ))}

            {/* LinkedIn action: approved + linkedin_medium + Pro + not published */}
            {liEligible &&
              (liConnected ? (
                <button
                  onClick={handlePublishLinkedIn}
                  disabled={isPending}
                  className="px-4 py-2 bg-[#0a66c2] hover:bg-[#085aab] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.554V9h3.565v11.452z" />
                  </svg>
                  {isPending ? "..." : "نشر إلى LinkedIn"}
                </button>
              ) : (
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#8892b0] text-sm rounded-md transition-colors inline-flex items-center gap-2"
                >
                  اربط حساب LinkedIn أوّلًا
                </Link>
              ))}

            {/* Already published to X */}
            {draft.status === "approved" && isXFormat && xAlreadyPublished && (
              <span className="px-4 py-2 text-[#4a9eff] text-sm inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                نُشر على X ✓
              </span>
            )}

            {/* Already published to LinkedIn */}
            {draft.status === "approved" && isLiFormat && xAlreadyPublished && (
              <span className="px-4 py-2 text-[#4a9eff] text-sm inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.554V9h3.565v11.452z" />
                </svg>
                نُشر على LinkedIn ✓
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rating / Feedback */}
      <RatingWidget draftId={draft.id} />
    </div>
  );
}
