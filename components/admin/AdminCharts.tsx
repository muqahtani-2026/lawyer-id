"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const GOLD = "#fbbf24";
const DONUT_COLORS = ["#fbbf24", "#4a9eff", "#4ade80", "#a78bfa", "#f87171"];

const TOOLTIP_STYLE = {
  backgroundColor: "#152a4a",
  border: "1px solid #1d3461",
  borderRadius: 6,
  fontFamily: "var(--font-body, IBM Plex Sans Arabic)",
  fontSize: 12,
  color: "#e6f1ff",
};

type DailyPoint = { date: string; count: number };
type TopLawyer = { user_id: string; full_name: string | null; count: number };

// ============================================================
// Daily Drafts Line Chart
// ============================================================

export function DailyDraftsChart({ data }: { data: DailyPoint[] }) {
  const isEmpty = data.every((d) => d.count === 0);

  const chartData = data.map((d) => {
    const date = new Date(d.date);
    return {
      ...d,
      label: date.toLocaleDateString("ar-SA", {
        weekday: "short",
        day: "numeric",
      }),
    };
  });

  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6">
      <h3
        className="text-xs font-mono tracking-[1.5px] mb-5"
        style={{ color: GOLD }}
      >
        DAILY DRAFTS · 7 DAYS
      </h3>
      {isEmpty ? (
        <div className="h-64 flex items-center justify-center text-[#8892b0] text-sm">
          لا توجد مسوّدات في آخر 7 أيّام
        </div>
      ) : (
        <div style={{ width: "100%", height: 256 }} dir="ltr">
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1d3461" />
              <XAxis
                dataKey="label"
                stroke="#8892b0"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="#8892b0"
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#e6f1ff" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={GOLD}
                strokeWidth={2.5}
                dot={{ r: 4, fill: GOLD, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: GOLD }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Top Lawyers Donut Chart
// ============================================================

export function TopLawyersDonut({ data }: { data: TopLawyer[] }) {
  const chartData = data.map((d, i) => ({
    name: d.full_name ?? "—",
    value: d.count,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6">
      <h3
        className="text-xs font-mono tracking-[1.5px] mb-5"
        style={{ color: GOLD }}
      >
        TOP 5 LAWYERS · BY DRAFTS
      </h3>
      {chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-[#8892b0] text-sm">
          لا يوجد محامون لديهم مسوّدات بعد
        </div>
      ) : (
        <div style={{ width: "100%", height: 256 }} dir="ltr">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number, name: string) => [
                  `${value} مسوّدة`,
                  name,
                ]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={9}
                wrapperStyle={{
                  fontSize: 11,
                  color: "#8892b0",
                  fontFamily: "var(--font-body, IBM Plex Sans Arabic)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
