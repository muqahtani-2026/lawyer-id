type Tone = "default" | "warning" | "success" | "danger";

type AdminKpiCardProps = {
  label: string;
  value: number | string;
  subtext?: string;
  tone?: Tone;
  icon?: React.ReactNode;
};

const ACCENT_BY_TONE: Record<Tone, string> = {
  default: "#fbbf24",
  warning: "#fbbf24",
  success: "#4ade80",
  danger: "#ef4444",
};

export function AdminKpiCard({
  label,
  value,
  subtext,
  tone = "default",
  icon,
}: AdminKpiCardProps) {
  const accent = ACCENT_BY_TONE[tone];

  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-5 md:p-6 hover:border-[#152a4a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div
          className="text-[11px] font-mono tracking-wider"
          style={{ color: accent }}
        >
          {label}
        </div>
        {icon && (
          <div className="opacity-50" style={{ color: accent }}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-4xl md:text-5xl font-bold font-mono leading-none">
        {value}
      </div>
      {subtext && (
        <div className="text-xs text-[#8892b0] mt-3 leading-relaxed">
          {subtext}
        </div>
      )}
    </div>
  );
}
