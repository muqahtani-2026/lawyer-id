import {
  getReportsOverallKpis,
  getQualityTrend,
  getStatusDistribution,
  getTopLegalSources,
  getLawyerPerformance,
  getGenerationVolume,
} from "@/lib/queries/admin-reports";

import {
  QualityTrendChart,
  StatusDistributionChart,
  TopLegalSourcesChart,
  GenerationVolumeChart,
} from "@/components/admin/ReportsCharts";

import { LawyerPerformanceTable } from "@/components/admin/ReportsTables";

export const dynamic = "force-dynamic";

// =====================================================================
// Inline helpers
// =====================================================================

function KpiCard({
  label,
  value,
  unit,
  hint,
  accent = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card, #0f1f3d)",
        border: "1px solid var(--border, #1d3461)",
        borderRadius: 12,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minHeight: 168,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: accent
            ? "var(--accent-admin, #fbbf24)"
            : "var(--text-secondary, #8892b0)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 42,
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--text-primary, #e6f1ff)",
          display: "flex",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text-secondary, #8892b0)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary, #8892b0)",
            marginTop: "auto",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  eyebrow,
  badge,
  children,
}: {
  eyebrow: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card, #0f1f3d)",
        border: "1px solid var(--border, #1d3461)",
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent-admin, #fbbf24)",
          }}
        >
          {eyebrow}
        </div>
        {badge && (
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-secondary, #8892b0)",
            }}
          >
            {badge}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// =====================================================================
// Page
// =====================================================================

export default async function ReportsPage() {
  const [kpis, qualityTrend, statusDist, topSources, lawyerPerf, genVolume] =
    await Promise.all([
      getReportsOverallKpis(),
      getQualityTrend(),
      getStatusDistribution(),
      getTopLegalSources(5),
      getLawyerPerformance(),
      getGenerationVolume(30),
    ]);

  return (
    <main
      style={{
        padding: "48px 32px 64px",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      {/* ============================================================
          Header
          ============================================================ */}
      <header style={{ marginBottom: 40, textAlign: "right" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--accent-admin, #fbbf24)",
            }}
          >
            ADMIN · REPORTS
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-secondary, #8892b0)",
            }}
          >
            {kpis.total_drafts} مسوّدة في الإجماليّ
          </div>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display, var(--font-sans, inherit))",
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "var(--text-primary, #e6f1ff)",
            marginBottom: 10,
          }}
        >
          التَّقارير التَّحليليَّة
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--text-secondary, #8892b0)",
            maxWidth: 640,
            marginInlineStart: "auto",
            lineHeight: 1.6,
          }}
        >
          نظرة عميقة على أداء المنصّة عبر الزمن: اتّجاهات الجودة، توزيع الحالات،
          الأنظمة الأكثر استخدامًا، وأداء المحامين الفرديّ.
        </p>
      </header>

      {/* ============================================================
          KPIs Bar — 4 cards
          ============================================================ */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <KpiCard
          label="TOTAL DRAFTS"
          value={kpis.total_drafts}
          hint="إجماليّ المسوّدات المُولَّدة على المنصّة"
          accent
        />
        <KpiCard
          label="APPROVAL RATE"
          value={kpis.approval_rate}
          unit="٪"
          hint="من المسوّدات التي تمّت مراجعتها"
        />
        <KpiCard
          label="AVG QUALITY"
          value={kpis.avg_quality}
          unit="/100"
          hint="متوسّط نتيجة الجودة الإجماليّة"
        />
        <KpiCard
          label="AVG REVIEW TIME"
          value={kpis.avg_review_hours}
          unit="ساعة"
          hint="من التوليد حتّى أوّل مراجعة"
        />
      </section>

      {/* ============================================================
          Quality Trend — 8 weeks
          ============================================================ */}
      <section style={{ marginBottom: 24 }}>
        <SectionCard eyebrow="QUALITY TREND" badge="8 WEEKS">
          <QualityTrendChart data={qualityTrend} />
        </SectionCard>
      </section>

      {/* ============================================================
          Status Distribution + Top Legal Sources
          ============================================================ */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <SectionCard eyebrow="STATUS DISTRIBUTION" badge="ALL TIME">
          <StatusDistributionChart data={statusDist} />
        </SectionCard>

        <SectionCard
          eyebrow="TOP LEGAL SOURCES"
          badge={topSources.length > 0 ? `${topSources.length} نظام` : undefined}
        >
          <TopLegalSourcesChart data={topSources} />
        </SectionCard>
      </section>

      {/* ============================================================
          Generation Volume — 30 days
          ============================================================ */}
      <section style={{ marginBottom: 24 }}>
        <SectionCard eyebrow="GENERATION VOLUME" badge="30 DAYS">
          <GenerationVolumeChart data={genVolume} />
        </SectionCard>
      </section>

      {/* ============================================================
          Lawyer Performance Table
          ============================================================ */}
      <section>
        <SectionCard
          eyebrow="LAWYER PERFORMANCE"
          badge={`${lawyerPerf.length} محامي`}
        >
          <LawyerPerformanceTable rows={lawyerPerf} />
        </SectionCard>
      </section>
    </main>
  );
}
