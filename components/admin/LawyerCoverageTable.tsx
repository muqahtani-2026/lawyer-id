import Link from "next/link";
import type { LawyerCoverageRow } from "@/lib/queries/admin-operations";

const COLORS = {
  cardBg: "#0f1f3d",
  elevatedBg: "#152a4a",
  border: "#1d3461",
  text: "#e6f1ff",
  textSecondary: "#8892b0",
  success: "#4ade80",
  accent: "#fbbf24",
  accentLawyer: "#4a9eff",
};

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "لا يوجد";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "الآن";
  if (diffMin < 60) return `قبل ${diffMin} د`;
  if (diffHr < 24) return `قبل ${diffHr} س`;
  if (diffDay < 7) return `قبل ${diffDay} يوم`;
  return d.toLocaleDateString("ar-SA");
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const bg = isActive
    ? "rgba(74, 222, 128, 0.15)"
    : "rgba(136, 146, 176, 0.15)";
  const color = isActive ? COLORS.success : COLORS.textSecondary;
  const label = isActive ? "نشط" : "غير نشط";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "12px",
        background: bg,
        color: color,
        fontSize: "11px",
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function ChannelBadge({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "10px",
        background: enabled ? "rgba(74, 158, 255, 0.15)" : "transparent",
        color: enabled ? COLORS.accentLawyer : COLORS.textSecondary,
        fontSize: "10px",
        fontWeight: 500,
        border: enabled
          ? "1px solid rgba(74, 158, 255, 0.3)"
          : `1px dashed ${COLORS.border}`,
        marginInlineEnd: "4px",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {label}
    </span>
  );
}

export function LawyerCoverageTable({ rows }: { rows: LawyerCoverageRow[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: COLORS.textSecondary,
          fontSize: "14px",
        }}
      >
        لا توجد بيانات لعرضها.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          color: COLORS.text,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: `1px solid ${COLORS.border}`,
              color: COLORS.textSecondary,
              fontSize: "11px",
              textAlign: "right",
            }}
          >
            <th style={{ padding: "10px 12px", fontWeight: 600 }}>المحامي</th>
            <th style={{ padding: "10px 12px", fontWeight: 600 }}>الحالة</th>
            <th
              style={{
                padding: "10px 12px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              آخر 7 أيام
            </th>
            <th
              style={{
                padding: "10px 12px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              الإجماليّ
            </th>
            <th style={{ padding: "10px 12px", fontWeight: 600 }}>
              آخر نشاط
            </th>
            <th style={{ padding: "10px 12px", fontWeight: 600 }}>القنوات</th>
            <th
              style={{
                padding: "10px 12px",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              الإرسال
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.user_id}
              style={{
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <td style={{ padding: "12px" }}>
                <Link
                  href={`/admin/lawyers/${row.user_id}`}
                  style={{
                    color: COLORS.text,
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {row.full_name || "بدون اسم"}
                  {row.is_admin && (
                    <span
                      style={{
                        marginInlineStart: "6px",
                        padding: "1px 6px",
                        background: "rgba(251, 191, 36, 0.15)",
                        color: COLORS.accent,
                        borderRadius: "6px",
                        fontSize: "9px",
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      ADMIN
                    </span>
                  )}
                </Link>
                <div
                  style={{
                    fontSize: "11px",
                    color: COLORS.textSecondary,
                    direction: "ltr",
                    textAlign: "right",
                    marginTop: "2px",
                  }}
                >
                  {row.email}
                </div>
              </td>
              <td style={{ padding: "12px" }}>
                <StatusBadge isActive={row.is_active} />
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: 600,
                  color:
                    row.drafts_last_7_days > 0
                      ? COLORS.text
                      : COLORS.textSecondary,
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {row.drafts_last_7_days}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                  color: COLORS.textSecondary,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {row.total_drafts}
              </td>
              <td
                style={{
                  padding: "12px",
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                }}
              >
                {formatRelativeTime(row.last_activity)}
              </td>
              <td style={{ padding: "12px" }}>
                <ChannelBadge enabled={row.telegram_enabled} label="TG" />
                <ChannelBadge enabled={row.email_enabled} label="MAIL" />
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "center",
                  color: COLORS.textSecondary,
                  fontSize: "12px",
                  fontVariantNumeric: "tabular-nums",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {row.preferred_send_hour !== null
                  ? `${String(row.preferred_send_hour).padStart(2, "0")}:00`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
