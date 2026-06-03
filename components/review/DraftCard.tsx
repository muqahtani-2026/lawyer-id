import Link from "next/link";
import { cn } from "@/lib/utils";
import type { DraftListSummary } from "@/lib/queries/review";

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

const statusBadgeStyles: Record<string, string> = {
  pending: "bg-[#3a2a0a] text-[#fbbf24] border-[#fbbf24]/30",
  approved: "bg-[#0a3a1a] text-[#4ade80] border-[#4ade80]/30",
  rejected: "bg-[#3a0a0a] text-[#ef4444] border-[#ef4444]/30",
  published: "bg-[#152a4a] text-[#4a9eff] border-[#4a9eff]/30",
};

const statusLabels: Record<string, string> = {
  pending: "بانتظار",
  approved: "مقبولة",
  rejected: "مرفوضة",
  published: "منشورة",
};

export function DraftCard({ draft }: { draft: DraftListSummary }) {
  const title = draft.draft_title ?? draft.source_title ?? "بدون عنوان";
  const statusKey = draft.status in statusBadgeStyles ? draft.status : "pending";

  return (
    <Link
      href={`/review/${draft.id}`}
      className="block bg-[#0f1f3d] border border-[#1d3461] hover:border-[#4a9eff] rounded-lg p-4 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base text-[#e6f1ff] group-hover:text-[#4a9eff] font-semibold leading-snug line-clamp-2 flex-1 transition-colors">
          {title}
        </h3>
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded border whitespace-nowrap",
            statusBadgeStyles[statusKey]
          )}
        >
          {statusLabels[statusKey] ?? draft.status}
        </span>
      </div>

      {draft.draft_summary && (
        <p className="text-sm text-[#8892b0] mb-3 line-clamp-2 leading-relaxed">
          {draft.draft_summary}
        </p>
      )}

      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#8892b0]">
        <span>{formatRelativeTime(draft.created_at)}</span>
        {draft.quality_score !== null && (
          <span
            className="text-[#4a9eff]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            جودة: {draft.quality_score}
          </span>
        )}
        {draft.legal_branch && (
          <span className="px-2 py-0.5 bg-[#152a4a] rounded text-[#8892b0] text-[10px]">
            {draft.legal_branch}
          </span>
        )}
      </div>
    </Link>
  );
}
