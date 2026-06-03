"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type {
  QualityTrendPoint,
  StatusDistributionRow,
  TopLegalSourceRow,
  GenerationVolumePoint,
} from "@/lib/queries/admin-reports";

// =====================================================================
// Shared theming
// =====================================================================

const COLORS = {
  primary: "#fbbf24", // admin accent
  secondary: "#4a9eff", // lawyer accent
  success: "#4ade80",
  danger: "#ef4444",
  textPrimary: "#e6f1ff",
  textSecondary: "#8892b0",
  border: "#1d3461",
  bgElevated: "#152a4a",
};

const STATUS_COLORS: Record<string, string> = {
  pending: COLORS.primary,
  approved: COLORS.success,
  published: COLORS.secondary,
  rejected: COLORS.danger,
};

// Tooltip مخصّص داكن
function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: COLORS.bgElevated,
        border: `1px solid ${COLORS.border}`,
        padding: "10px 14px",
        borderRadius: 8,
        color: COLORS.textPrimary,
        fontSize: 13,
        fontFamily: "var(--font-sans, inherit)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {label && (
        <div
          style={{
            marginBottom: 6,
            color: COLORS.textSecondary,
            fontSize: 12,
          }}
        >
          {label}
        </div>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, lineHeight: 1.6 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        color: COLORS.textSecondary,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

// =====================================================================
// 1) Quality Trend — Area Chart (آخر 8 أسابيع)
// =====================================================================

export function QualityTrendChart({ data }: { data: QualityTrendPoint[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return <EmptyState message="لا توجد مسوّدات بنتيجة جودة في الأسابيع الأخيرة" />;
  }

  // الأسابيع الفارغة (count=0) تظهر كـ null لإحداث gaps بدلًا من خطّ على الصفر
  const chartData = data.map((d) => ({
    ...d,
    display_quality: d.count > 0 ? d.avg_quality : null,
  }));

  return (
    <ResponsiveContainer width="100%" aspect={2.5} minHeight={240}>
      <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <defs>
          <linearGradient id="qualityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.4} />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="week_label"
          stroke={COLORS.textSecondary}
          tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: COLORS.border }}
        />
        <YAxis
          domain={[0, 100]}
          stroke={COLORS.textSecondary}
          tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ stroke: COLORS.border }} />
        <Area
          type="monotone"
          dataKey="display_quality"
          name="متوسّط الجودة"
          stroke={COLORS.primary}
          strokeWidth={2.5}
          fill="url(#qualityFill)"
          dot={{ fill: COLORS.primary, r: 4 }}
          activeDot={{ r: 6, fill: COLORS.primary }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// =====================================================================
// 2) Status Distribution — Donut
// =====================================================================

export function StatusDistributionChart({
  data,
}: {
  data: StatusDistributionRow[];
}) {
  if (data.length === 0) {
    return <EmptyState message="لا توجد مسوّدات بعد" />;
  }

  return (
    <ResponsiveContainer width="100%" aspect={1.6} minHeight={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label_ar"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          stroke={COLORS.bgElevated}
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] ?? COLORS.textSecondary}
            />
          ))}
        </Pie>
        <Tooltip content={<DarkTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: COLORS.textPrimary, fontSize: 13 }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// =====================================================================
// 3) Top Legal Sources — Horizontal Bar
// =====================================================================

export function TopLegalSourcesChart({
  data,
}: {
  data: TopLegalSourceRow[];
}) {
  if (data.length === 0) {
    return <EmptyState message="لم تُستخدم أيّ أنظمة في المسوّدات بعد" />;
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  // عرض كقائمة بصريّة بـ inline bars — يعمل بشكل أنيق سواء كان عنصرًا واحدًا أو خمسة
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "8px 0",
        minHeight: 240,
      }}
    >
      {data.map((row, idx) => {
        const pct = maxCount > 0 ? (row.count / maxCount) * 100 : 0;
        return (
          <div
            key={row.source_legal_id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 14,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flex: 1,
                }}
                title={row.title}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 22,
                    color: COLORS.textSecondary,
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 12,
                  }}
                >
                  {idx + 1}.
                </span>
                {row.title}
              </span>
              <span
                style={{
                  color: COLORS.primary,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 14,
                  fontWeight: 600,
                  minWidth: 32,
                  textAlign: "left",
                }}
              >
                {row.count}
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: COLORS.border,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(pct, 6)}%`,
                  background: `linear-gradient(90deg, ${COLORS.primary} 0%, rgba(251,191,36,0.6) 100%)`,
                  borderRadius: 4,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================================
// 4) Generation Volume — Bar Chart (آخر 30 يومًا)
// =====================================================================

export function GenerationVolumeChart({
  data,
}: {
  data: GenerationVolumePoint[];
}) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return <EmptyState message="لا توليد في آخر 30 يومًا" />;
  }

  // أظهر label واحد كلّ ~5 أيّام لتجنّب الازدحام
  const total = data.length;
  const interval = Math.max(0, Math.floor(total / 6) - 1);

  return (
    <ResponsiveContainer width="100%" aspect={3} minHeight={220}>
      <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="day_label"
          stroke={COLORS.textSecondary}
          tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: COLORS.border }}
          interval={interval}
        />
        <YAxis
          stroke={COLORS.textSecondary}
          tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
          allowDecimals={false}
        />
        <Tooltip content={<DarkTooltip />} cursor={{ fill: COLORS.border }} />
        <Bar
          dataKey="count"
          name="مسوّدات مُولَّدة"
          fill={COLORS.secondary}
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
