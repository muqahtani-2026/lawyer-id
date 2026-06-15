"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DailyActivityPoint } from "@/lib/queries/me";

export function AnalyticsChart({ data }: { data: DailyActivityPoint[] }) {
  const empty = data.every((d) => d.profile_views + d.article_views + d.contact_clicks === 0);

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <h3 className="mb-4 text-sm font-medium text-content">النشاط — آخر 30 يومًا</h3>
      {empty ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted">
          لا نشاط بعد. سيظهر هنا فور بدء الزوّار بزيارة ملفك ومقالاتك.
        </div>
      ) : (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4a9eff" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#4a9eff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1d3461" />
              <XAxis dataKey="label" tick={{ fill: "#8892b0", fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#8892b0", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f1f3d", border: "1px solid #1d3461", borderRadius: 8, color: "#e6f1ff" }}
                labelStyle={{ color: "#8892b0" }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#8892b0" }} />
              <Area type="monotone" dataKey="profile_views" name="مشاهدات الملف" stroke="#4a9eff" fill="url(#gp)" />
              <Area type="monotone" dataKey="article_views" name="مشاهدات المقالات" stroke="#a855f7" fill="url(#ga)" />
              <Area type="monotone" dataKey="contact_clicks" name="نقرات التواصل" stroke="#4ade80" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
