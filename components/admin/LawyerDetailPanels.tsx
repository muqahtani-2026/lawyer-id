import type { AdminLawyerDetail } from "@/lib/queries/admin-lawyers";

const GOLD = "#fbbf24";

// ============================================================
// Shared building blocks
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

function SectionTitle({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-baseline gap-2 mb-5">
      <h3
        className="text-xs font-mono tracking-[1.5px]"
        style={{ color: GOLD }}
      >
        {children}
      </h3>
      {count !== undefined && (
        <span className="text-xs font-mono text-[#8892b0]">· {count}</span>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#8892b0] mb-1.5 font-mono">
        {label}
      </div>
      <div className={`text-sm text-[#e6f1ff] ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================
// Profile Panel
// ============================================================

const TONE_LABELS: Record<string, string> = {
  formal: "رسميّ",
  friendly: "ودّيّ",
  authoritative: "موثوق",
  casual: "غير رسميّ",
};
const LENGTH_LABELS: Record<string, string> = {
  short: "قصير",
  medium: "متوسّط",
  long: "طويل",
};
const AUDIENCE_LABELS: Record<string, string> = {
  individuals: "أفراد",
  companies: "شركات",
  legal_professionals: "متخصّصون",
  general: "عامّ",
};

export function ProfilePanel({
  lawyer_profile,
  specialties,
}: {
  lawyer_profile: AdminLawyerDetail["lawyer_profile"];
  specialties: AdminLawyerDetail["specialties"];
}) {
  const isEmpty = !lawyer_profile && specialties.length === 0;

  return (
    <Card>
      <SectionTitle>WRITING PROFILE</SectionTitle>

      {isEmpty ? (
        <p className="text-sm text-[#8892b0]">
          لم يكتمل الملفّ الكتابيّ بعد.
        </p>
      ) : (
        <div className="space-y-5">
          <Field
            label="التخصّصات"
            value={
              specialties.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {specialties.map((s) => (
                    <span
                      key={s.id}
                      className={`text-xs px-2 py-1 rounded ${
                        s.is_primary
                          ? "border"
                          : "bg-[#152a4a] border border-[#1d3461]"
                      }`}
                      style={
                        s.is_primary
                          ? {
                              backgroundColor: `${GOLD}20`,
                              borderColor: `${GOLD}66`,
                            }
                          : undefined
                      }
                    >
                      {s.name_ar}
                      {s.is_primary && (
                        <span
                          className="text-[10px] ms-1.5"
                          style={{ color: GOLD }}
                        >
                          ★
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                "—"
              )
            }
          />

          {lawyer_profile && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="النبرة"
                  value={
                    TONE_LABELS[lawyer_profile.tone ?? ""] ??
                    lawyer_profile.tone ??
                    "—"
                  }
                />
                <Field
                  label="الطول المُفضَّل"
                  value={
                    LENGTH_LABELS[lawyer_profile.target_length ?? ""] ??
                    lawyer_profile.target_length ??
                    "—"
                  }
                />
              </div>
              <Field
                label="الجمهور المُستهدَف"
                value={
                  AUDIENCE_LABELS[lawyer_profile.target_audience ?? ""] ??
                  lawyer_profile.target_audience ??
                  "—"
                }
              />
              {lawyer_profile.writing_style && (
                <Field
                  label="أسلوب الكتابة (Custom)"
                  value={
                    <span className="text-xs leading-relaxed">
                      {lawyer_profile.writing_style}
                    </span>
                  }
                />
              )}
              {lawyer_profile.bio && (
                <Field
                  label="السيرة الشخصيّة"
                  value={
                    <span className="text-xs leading-relaxed">
                      {lawyer_profile.bio}
                    </span>
                  }
                />
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// Notification Panel
// ============================================================

const DELIVERY_META: Record<string, { label: string; color: string }> = {
  telegram: { label: "Telegram", color: "#4a9eff" },
  email: { label: "Email", color: "#a78bfa" },
  both: { label: "Telegram + Email", color: "#4ade80" },
  none: { label: "معطَّلة", color: "#8892b0" },
};

export function NotificationPanel({
  prefs,
}: {
  prefs: AdminLawyerDetail["notification_prefs"];
}) {
  return (
    <Card>
      <SectionTitle>NOTIFICATIONS</SectionTitle>

      {!prefs ? (
        <p className="text-sm text-[#8892b0]">
          لم تُضبط تفضيلات الإشعارات بعد.
        </p>
      ) : (
        <div className="space-y-5">
          <Field
            label="طريقة التسليم"
            value={
              <span
                style={{
                  color:
                    DELIVERY_META[prefs.delivery_method]?.color ?? "#e6f1ff",
                }}
              >
                {DELIVERY_META[prefs.delivery_method]?.label ??
                  prefs.delivery_method}
              </span>
            }
          />
          <Field
            label="وقت التسليم اليوميّ"
            value={prefs.delivery_time?.slice(0, 5) ?? "—"}
            mono
          />
          <Field
            label="Telegram Chat ID"
            value={
              prefs.telegram_chat_id
                ? `••••${prefs.telegram_chat_id.slice(-4)}`
                : "—"
            }
            mono
          />
        </div>
      )}
    </Card>
  );
}

// ============================================================
// Samples Panel
// ============================================================

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "X / Twitter",
  blog: "Blog",
  linkedin: "LinkedIn",
};

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#4a9eff",
  blog: "#a78bfa",
  linkedin: "#4ade80",
};

export function SamplesPanel({
  samples,
}: {
  samples: AdminLawyerDetail["samples"];
}) {
  return (
    <Card>
      <SectionTitle count={samples.length}>WRITING SAMPLES</SectionTitle>

      {samples.length === 0 ? (
        <p className="text-sm text-[#8892b0]">
          لم يرفع أيّ عيّنات كتابة بعد.
        </p>
      ) : (
        <ul className="space-y-4">
          {samples.map((s) => (
            <li
              key={s.id}
              className="pb-4 border-b border-[#1d3461]/50 last:border-b-0 last:pb-0"
            >
              <div className="flex items-start gap-3 mb-2 flex-wrap">
                <span
                  className="text-[10px] px-2 py-0.5 rounded font-mono tracking-wider"
                  style={{
                    backgroundColor: `${PLATFORM_COLORS[s.platform] ?? "#8892b0"}20`,
                    color: PLATFORM_COLORS[s.platform] ?? "#8892b0",
                  }}
                >
                  {PLATFORM_LABELS[s.platform] ?? s.platform}
                </span>
                {s.title && (
                  <span className="text-sm font-medium text-[#e6f1ff]">
                    {s.title}
                  </span>
                )}
                <span className="text-xs text-[#8892b0] ms-auto font-mono">
                  {formatDate(s.created_at)}
                </span>
              </div>
              <p className="text-xs text-[#8892b0] leading-relaxed">
                {s.content_preview}
                {s.content_preview.length >= 220 && "..."}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ============================================================
// Drafts Panel
// ============================================================

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "#fbbf24" },
  approved: { label: "مُعتمدة", color: "#4ade80" },
  rejected: { label: "مرفوضة", color: "#ef4444" },
  published: { label: "منشورة", color: "#a78bfa" },
};

export function DraftsPanel({
  drafts,
}: {
  drafts: AdminLawyerDetail["recent_drafts"];
}) {
  return (
    <Card>
      <SectionTitle count={drafts.length}>RECENT DRAFTS</SectionTitle>

      {drafts.length === 0 ? (
        <p className="text-sm text-[#8892b0]">
          لا توجد مسوّدات لهذا المحامي بعد.
        </p>
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => {
            const status = STATUS_META[d.status] ?? {
              label: d.status,
              color: "#8892b0",
            };
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg hover:bg-[#152a4a]/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="text-[10px] px-2 py-1 rounded font-mono tracking-wider flex-shrink-0"
                    style={{
                      backgroundColor: `${status.color}20`,
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </span>
                  <span className="text-sm text-[#e6f1ff] truncate">
                    {d.draft_title ?? (
                      <span className="text-[#8892b0]">بدون عنوان</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {d.quality_score !== null && (
                    <span className="text-xs font-mono text-[#8892b0]">
                      {d.quality_score}/100
                    </span>
                  )}
                  <span className="text-xs font-mono text-[#8892b0]">
                    {formatDate(d.created_at)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
