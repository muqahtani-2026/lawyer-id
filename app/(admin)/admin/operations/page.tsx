import {
  getOperationsKpis,
  getDraftsLast14Days,
  getLawyerCoverage,
} from "@/lib/queries/admin-operations";
import { DailyOperationsChart } from "@/components/admin/DailyOperationsChart";
import { LawyerCoverageTable } from "@/components/admin/LawyerCoverageTable";

export const dynamic = "force-dynamic";

const COLORS = {
  bg: "#0a192f",
  cardBg: "#0f1f3d",
  elevatedBg: "#152a4a",
  border: "#1d3461",
  text: "#e6f1ff",
  textSecondary: "#8892b0",
  accent: "#fbbf24",
  accentLawyer: "#4a9eff",
  success: "#4ade80",
  warning: "#fbbf24",
};

function KpiCard({
  label,
  value,
  suffix,
  isAccent = false,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  isAccent?: boolean;
}) {
  return (
    <div
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: COLORS.textSecondary,
          marginBottom: "10px",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: isAccent ? COLORS.accent : COLORS.text,
          fontFamily: "'JetBrains Mono', monospace",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
        }}
      >
        <span>{value}</span>
        {suffix && (
          <span
            style={{
              fontSize: "12px",
              color: COLORS.textSecondary,
              fontWeight: 500,
              fontFamily: "inherit",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "12px",
        padding: "24px",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: COLORS.text,
            margin: 0,
            fontFamily: "'Readex Pro', sans-serif",
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: "12px",
              color: COLORS.textSecondary,
              margin: "4px 0 0 0",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default async function OperationsPage() {
  // جلب موازي للـ 3 datasets
  const [kpis, dailyData, coverage] = await Promise.all([
    getOperationsKpis(),
    getDraftsLast14Days(),
    getLawyerCoverage(),
  ]);

  return (
    <div
      style={{ minHeight: "100vh", background: COLORS.bg, padding: "32px" }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "11px",
              color: COLORS.accent,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "1.5px",
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            ADMIN · OPERATIONS
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: COLORS.text,
              margin: 0,
              fontFamily: "'Readex Pro', sans-serif",
            }}
          >
            التَّشغيلُ اليَوميّ
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: COLORS.textSecondary,
              margin: "8px 0 0 0",
            }}
          >
            مراقبة الإنتاج اليوميّ + تغطية المحامين + قنوات التوزيع.
          </p>
        </div>

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <KpiCard
            label="المحامون النشطون"
            value={kpis.active_lawyers}
            suffix="آخر 7 أيام"
            isAccent
          />
          <KpiCard label="مسوّدات اليوم" value={kpis.drafts_today} />
          <KpiCard label="آخر 7 أيام" value={kpis.drafts_last_7_days} />
          <KpiCard label="بانتظار المُراجعة" value={kpis.pending_review} />
        </div>

        {/* Chart */}
        <div style={{ marginBottom: "24px" }}>
          <SectionCard
            title="حركةُ الإنتاج (14 يومًا)"
            subtitle="المسوّدات المُولّدة مقابل المُراجَعة يوميًّا."
          >
            <DailyOperationsChart data={dailyData} />
          </SectionCard>
        </div>

        {/* Coverage Table */}
        <SectionCard
          title="تغطيةُ المحامين"
          subtitle="مسوّدات كلّ محامٍ في آخر 7 أيام + قنوات التوزيع + ساعة الإرسال."
        >
          <LawyerCoverageTable rows={coverage} />
        </SectionCard>
      </div>
    </div>
  );
}
