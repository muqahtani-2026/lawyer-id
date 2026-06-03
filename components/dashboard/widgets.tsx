import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  AgentStatus,
  ProfileCompletion,
  DraftListItem,
} from "@/lib/queries/dashboard";

// ============================================================
// Helpers
// ============================================================

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

// ============================================================
// KpiCard
// ============================================================

type KpiVariant = "default" | "warning" | "success" | "info";

interface KpiCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon: React.ReactNode;
  variant?: KpiVariant;
}

const variantStyles: Record<KpiVariant, { iconBg: string; iconColor: string; valueColor: string }> = {
  default: { iconBg: "bg-[#152a4a]", iconColor: "text-[#4a9eff]", valueColor: "text-[#e6f1ff]" },
  info:    { iconBg: "bg-[#152a4a]", iconColor: "text-[#4a9eff]", valueColor: "text-[#4a9eff]" },
  warning: { iconBg: "bg-[#3a2a0a]", iconColor: "text-[#fbbf24]", valueColor: "text-[#fbbf24]" },
  success: { iconBg: "bg-[#0a3a1a]", iconColor: "text-[#4ade80]", valueColor: "text-[#4ade80]" },
};

export function KpiCard({ label, value, sublabel, icon, variant = "default" }: KpiCardProps) {
  const styles = variantStyles[variant];
  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5 hover:border-[#2d4a7d] transition-colors">
      <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-md mb-3", styles.iconBg)}>
        <span className={styles.iconColor}>{icon}</span>
      </div>
      <div
        className={cn("text-3xl font-bold mb-1 leading-none", styles.valueColor)}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {value}
      </div>
      <div className="text-sm text-[#e6f1ff]">{label}</div>
      {sublabel && <div className="text-xs text-[#8892b0] mt-0.5">{sublabel}</div>}
    </div>
  );
}

// ============================================================
// AgentStatusCard
// ============================================================

export function AgentStatusCard({ status }: { status: AgentStatus }) {
  const isActive = status.status === "active";
  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-[#8892b0] mb-1">وكيل المحتوى</h3>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block w-2.5 h-2.5 rounded-full",
                isActive ? "bg-[#4ade80] animate-pulse" : "bg-[#8892b0]"
              )}
            />
            <span
              className={cn(
                "text-xl font-semibold",
                isActive ? "text-[#4ade80]" : "text-[#8892b0]"
              )}
            >
              {isActive ? "نشط" : "متوقّف"}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#152a4a] text-[#4a9eff]">
          <RobotIcon />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1d3461]">
        <div>
          <div className="text-xs text-[#8892b0] mb-1">آخر تشغيل</div>
          <div className="text-sm text-[#e6f1ff]">
            {status.lastRunAt ? formatRelativeTime(status.lastRunAt) : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-[#8892b0] mb-1">مسوّدات اليوم</div>
          <div
            className="text-sm text-[#e6f1ff] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {status.draftsToday}
          </div>
        </div>
      </div>

      {!isActive && status.hoursSinceLastRun !== null && (
        <div className="mt-4 p-3 bg-[#3a2a0a] border border-[#fbbf24]/30 rounded-md text-xs text-[#fbbf24]">
          لم تُولَّد مسوّدات منذ {Math.round(status.hoursSinceLastRun)} ساعة. سيتمّ التشغيل التلقائيّ في الجدولة القادمة.
        </div>
      )}
    </div>
  );
}

// ============================================================
// ProfileCompletionCard
// ============================================================

export function ProfileCompletionCard({ completion }: { completion: ProfileCompletion }) {
  const { percentage, filledCount, totalFields, missingFields } = completion;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const ringColor =
    percentage >= 80 ? "#4ade80" :
    percentage >= 40 ? "#4a9eff" :
    "#fbbf24";

  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5 h-full flex flex-col">
      <h3 className="text-sm font-medium text-[#8892b0] mb-4">اكتمال المِلَفّ</h3>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="#1d3461" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-lg font-bold text-[#e6f1ff]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {percentage}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-[#e6f1ff] mb-0.5">
            {filledCount} من {totalFields} حقول
          </div>
          <div className="text-xs text-[#8892b0]">
            {percentage >= 80 ? "ممتاز — مِلَفّك شبه مكتمل." :
             percentage >= 40 ? "تقدُّم جيّد — أكمل بقيّة الحقول." :
             "ابدأ بإكمال مِلَفّك للحصول على مسوّدات أفضل."}
          </div>
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className="flex-1 mb-4">
          <div className="text-xs text-[#8892b0] mb-2">ينقص:</div>
          <ul className="space-y-1">
            {missingFields.slice(0, 3).map((field) => (
              <li key={field} className="text-xs text-[#e6f1ff] flex items-center gap-2">
                <span className="inline-block w-1 h-1 rounded-full bg-[#fbbf24]" />
                {field}
              </li>
            ))}
            {missingFields.length > 3 && (
              <li className="text-xs text-[#8892b0]">+ {missingFields.length - 3} حقل آخر</li>
            )}
          </ul>
        </div>
      )}

      <Link
        href="/profile"
        className="block w-full text-center py-2 px-4 bg-[#152a4a] hover:bg-[#1d3461] border border-[#1d3461] hover:border-[#4a9eff] rounded-md text-sm text-[#4a9eff] transition-colors"
      >
        أكمل مِلَفّك ←
      </Link>
    </div>
  );
}

// ============================================================
// RecentDraftsList
// ============================================================

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

export function RecentDraftsList({ drafts }: { drafts: DraftListItem[] }) {
  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#e6f1ff]">آخر المسوّدات</h3>
        <Link
          href="/review"
          className="text-xs text-[#4a9eff] hover:text-[#7ab8ff] transition-colors"
        >
          عرض الكلّ ←
        </Link>
      </div>

      {drafts.length === 0 ? (
        <div className="py-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#152a4a] mb-3">
            <DocumentIcon />
          </div>
          <p className="text-sm text-[#8892b0]">لا توجد مسوّدات بعد.</p>
          <p className="text-xs text-[#8892b0] mt-1">
            ستظهر مسوّداتك هنا بمجرّد تشغيل وكيل المحتوى.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="p-3 bg-[#152a4a] border border-[#1d3461] rounded-md hover:border-[#2d4a7d] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm text-[#e6f1ff] font-medium leading-snug line-clamp-2 flex-1">
                  {draft.draft_title ?? draft.source_title ?? "بدون عنوان"}
                </h4>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded border whitespace-nowrap",
                    statusBadgeStyles[draft.status] ?? statusBadgeStyles.pending
                  )}
                >
                  {statusLabels[draft.status] ?? draft.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#8892b0]">
                <span>{formatRelativeTime(draft.created_at)}</span>
                {draft.quality_score !== null && (
                  <span
                    className="text-[#4a9eff]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    جودة: {draft.quality_score}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Icons (inline SVG, no external deps)
// ============================================================

export function TotalIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function PendingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function RobotIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
