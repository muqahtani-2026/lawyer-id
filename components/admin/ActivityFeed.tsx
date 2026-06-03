import type { ActivityEvent, ActivityEventType } from "@/lib/queries/admin";

const GOLD = "#fbbf24";

type IconMeta = {
  symbol: React.ReactNode;
  label: string;
  color: string;
};

const EVENT_META: Record<ActivityEventType, IconMeta> = {
  draft_created: {
    label: "مسوّدة جديدة",
    color: "#4a9eff",
    symbol: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  draft_approved: {
    label: "تمّ الاعتماد",
    color: "#4ade80",
    symbol: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  draft_rejected: {
    label: "تمّ الرفض",
    color: "#ef4444",
    symbol: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  draft_published: {
    label: "تمّ النشر",
    color: "#a78bfa",
    symbol: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
        />
      </svg>
    ),
  },
};

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  if (diffHour < 24) return `قبل ${diffHour} ساعة`;
  if (diffDay < 7) return `قبل ${diffDay} يوم`;
  return new Date(isoDate).toLocaleDateString("ar-SA");
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-xs font-mono tracking-[1.5px]"
          style={{ color: GOLD }}
        >
          RECENT ACTIVITY · {events.length}
        </h3>
      </div>

      {events.length === 0 ? (
        <div className="py-16 text-center text-[#8892b0] text-sm">
          لا توجد أحداث بعد على المنصّة.
        </div>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const meta = EVENT_META[event.type];
            return (
              <li
                key={event.id}
                className="flex items-start gap-3 pb-3 border-b border-[#1d3461]/50 last:border-b-0 last:pb-0"
              >
                <span
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: meta.color }}
                  aria-hidden
                >
                  {meta.symbol}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-relaxed">
                    <span
                      className="font-medium"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[#8892b0] mx-1.5">—</span>
                    <span className="text-[#e6f1ff]">
                      {event.draft_title ?? "بدون عنوان"}
                    </span>
                  </div>
                  <div className="text-xs text-[#8892b0] mt-1">
                    {event.user_name ?? "—"}
                    <span className="mx-1.5">·</span>
                    {formatRelativeTime(event.occurred_at)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
