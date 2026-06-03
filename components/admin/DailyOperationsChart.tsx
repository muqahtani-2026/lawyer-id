"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  type TooltipProps,
} from "recharts";
import type { DailyOperationsPoint } from "@/lib/queries/admin-operations";

const COLORS = {
  generated: "#4a9eff",
  reviewed: "#fbbf24",
  grid: "#1d3461",
  axis: "#8892b0",
  text: "#e6f1ff",
  cardBg: "#0f1f3d",
  border: "#1d3461",
};

function DarkTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "13px",
        color: COLORS.text,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        minWidth: "150px",
      }}
    >
      <div
        style={{
          marginBottom: "8px",
          fontWeight: 600,
          paddingBottom: "6px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {label}
      </div>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            marginTop: idx > 0 ? "4px" : 0,
          }}
        >
          <span style={{ color: entry.color, fontSize: "12px" }}>
            {entry.name === "generated" ? "المُولّدة" : "المُراجَعة"}
          </span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DailyOperationsChart({
  data,
}: {
  data: DailyOperationsPoint[];
}) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: COLORS.axis,
          fontSize: "14px",
        }}
      >
        لا توجد بيانات لعرضها بعد.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: 280 }}>
      <ResponsiveContainer width="100%" aspect={2.8} minHeight={280}>
        <LineChart
          data={data}
          margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={COLORS.grid}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            stroke={COLORS.axis}
            style={{ fontSize: "11px" }}
            tickLine={false}
          />
          <YAxis
            stroke={COLORS.axis}
            style={{ fontSize: "11px" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<DarkTooltip />}
            cursor={{ stroke: COLORS.axis, strokeOpacity: 0.3 }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            formatter={(value) =>
              value === "generated" ? "المُولّدة" : "المُراجَعة"
            }
          />
          <Line
            type="monotone"
            dataKey="generated"
            stroke={COLORS.generated}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLORS.generated }}
            activeDot={{ r: 5 }}
            name="generated"
          />
          <Line
            type="monotone"
            dataKey="reviewed"
            stroke={COLORS.reviewed}
            strokeWidth={2.5}
            dot={{ r: 3, fill: COLORS.reviewed }}
            activeDot={{ r: 5 }}
            name="reviewed"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
