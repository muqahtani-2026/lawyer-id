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
import type { DraftsByDay, DraftsByStatus } from "@/lib/queries/dashboard";

// ============================================================
// Shared styles
// ============================================================

const TOOLTIP_STYLE = {
  background: "#152a4a",
  border: "1px solid #1d3461",
  borderRadius: 6,
  color: "#e6f1ff",
  fontSize: 12,
  fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
};

const AXIS_STYLE = {
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
};

// ============================================================
// DraftsLineChart — نشاط آخر 7 أيّام
// ============================================================

export function DraftsLineChart({ data }: { data: DraftsByDay[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-[#8892b0]">
        لا توجد بيانات بعد لعرض النشاط الأسبوعيّ.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1d3461" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          stroke="#8892b0"
          tick={AXIS_STYLE}
          axisLine={{ stroke: "#1d3461" }}
          tickLine={false}
        />
        <YAxis
          stroke="#8892b0"
          tick={AXIS_STYLE}
          axisLine={{ stroke: "#1d3461" }}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "#8892b0", marginBottom: 4 }}
          cursor={{ stroke: "#1d3461", strokeWidth: 1 }}
          formatter={(value: number) => [value, "مسوّدات"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#4a9eff"
          strokeWidth={2}
          dot={{ fill: "#4a9eff", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#4a9eff", stroke: "#0a192f", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// DraftsDonutChart — توزيع حسب الحالة
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  pending: "#fbbf24",
  approved: "#4ade80",
  rejected: "#ef4444",
  published: "#4a9eff",
};

export function DraftsDonutChart({ data }: { data: DraftsByStatus[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-[#8892b0]">
        لا توجد بيانات بعد لعرض التوزيع.
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="relative w-full" style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            cx="50%"
            cy="42%"
            innerRadius={45}
            outerRadius={72}
            paddingAngle={3}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, idx) => (
              <Cell
                key={idx}
                fill={STATUS_COLORS[entry.status] ?? "#4a9eff"}
                stroke="#0f1f3d"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [value, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize: 11,
              color: "#8892b0",
              fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
              paddingTop: 8,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div
        className="absolute inset-0 flex flex-col items-center pointer-events-none"
        style={{ paddingTop: "26%", paddingBottom: "36%" }}
      >
        <div
          className="text-2xl font-bold text-[#e6f1ff] leading-none"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {total}
        </div>
        <div className="text-[10px] text-[#8892b0] mt-1">المجموع</div>
      </div>
    </div>
  );
}
