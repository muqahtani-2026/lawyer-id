import type { LawyerPerformanceRow } from "@/lib/queries/admin-reports";

type Props = {
  rows: LawyerPerformanceRow[];
};

function QualityBadge({ score }: { score: number }) {
  let color = "#8892b0";
  let bg = "#1d3461";
  if (score >= 80) {
    color = "#4ade80";
    bg = "rgba(74,222,128,0.12)";
  } else if (score >= 60) {
    color = "#fbbf24";
    bg = "rgba(251,191,36,0.12)";
  } else if (score > 0) {
    color = "#ef4444";
    bg = "rgba(239,68,68,0.12)";
  }

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 12,
        fontWeight: 600,
        minWidth: 44,
        textAlign: "center",
      }}
    >
      {score > 0 ? score.toFixed(1) : "—"}
    </span>
  );
}

function ApprovalBadge({ rate, total }: { rate: number; total: number }) {
  if (total === 0) {
    return (
      <span style={{ color: "#8892b0", fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
        —
      </span>
    );
  }
  const color =
    rate >= 70 ? "#4ade80" : rate >= 40 ? "#fbbf24" : "#ef4444";
  return (
    <span
      style={{
        color,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {rate.toFixed(1)}٪
    </span>
  );
}

function HoursBadge({ hours, total }: { hours: number; total: number }) {
  if (total === 0 || hours === 0) {
    return (
      <span style={{ color: "#8892b0", fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
        —
      </span>
    );
  }
  return (
    <span
      style={{
        color: "#e6f1ff",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: 13,
      }}
    >
      {hours.toFixed(1)} س
    </span>
  );
}

export function LawyerPerformanceTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "#8892b0",
          fontSize: 14,
        }}
      >
        لا يوجد محامون مسجَّلون بعد.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid #1d3461",
              textAlign: "right",
            }}
          >
            <th
              style={{
                padding: "12px 16px",
                color: "#8892b0",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.05em",
              }}
            >
              المحامي
            </th>
            <th
              style={{
                padding: "12px 16px",
                color: "#8892b0",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.05em",
                textAlign: "center",
              }}
            >
              عدد المسوّدات
            </th>
            <th
              style={{
                padding: "12px 16px",
                color: "#8892b0",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.05em",
                textAlign: "center",
              }}
            >
              معدّل الموافقة
            </th>
            <th
              style={{
                padding: "12px 16px",
                color: "#8892b0",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.05em",
                textAlign: "center",
              }}
            >
              متوسّط الجودة
            </th>
            <th
              style={{
                padding: "12px 16px",
                color: "#8892b0",
                fontWeight: 500,
                fontSize: 12,
                letterSpacing: "0.05em",
                textAlign: "center",
              }}
            >
              زمن المراجعة
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.user_id}
              style={{
                borderBottom:
                  idx === rows.length - 1 ? "none" : "1px solid #1d3461",
                background:
                  idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
              }}
            >
              <td style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    color: "#e6f1ff",
                    fontWeight: 500,
                    marginBottom: 2,
                  }}
                >
                  {row.full_name || "(بلا اسم)"}
                </div>
                <div
                  style={{
                    color: "#8892b0",
                    fontSize: 12,
                    direction: "ltr",
                    textAlign: "right",
                  }}
                >
                  {row.email || "—"}
                </div>
              </td>
              <td
                style={{
                  padding: "14px 16px",
                  textAlign: "center",
                  color: "#e6f1ff",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                {row.total_drafts}
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <ApprovalBadge
                  rate={row.approval_rate}
                  total={row.total_drafts}
                />
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <QualityBadge score={row.avg_quality} />
              </td>
              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                <HoursBadge
                  hours={row.avg_review_hours}
                  total={row.total_drafts}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
