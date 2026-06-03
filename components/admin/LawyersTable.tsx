"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AdminLawyerRow } from "@/lib/queries/admin-lawyers";

type SortKey = "joined" | "drafts" | "name";

const GOLD = "#fbbf24";

export function LawyersTable({ lawyers }: { lawyers: AdminLawyerRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("joined");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = lawyers;

    if (q) {
      rows = rows.filter(
        (l) =>
          (l.full_name ?? "").toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.primary_specialty ?? "").toLowerCase().includes(q)
      );
    }

    const sorted = [...rows];
    switch (sortKey) {
      case "joined":
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "drafts":
        sorted.sort((a, b) => b.drafts_count - a.drafts_count);
        break;
      case "name":
        sorted.sort((a, b) =>
          (a.full_name ?? "").localeCompare(b.full_name ?? "", "ar")
        );
        break;
    }
    return sorted;
  }, [lawyers, search, sortKey]);

  const handleRowNav = (id: string) => router.push(`/admin/lawyers/${id}`);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث بالاسم، البريد، أو التخصّص..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0f1f3d] border border-[#1d3461] rounded-lg ps-10 pe-4 py-2.5 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24] transition-colors"
          />
          <svg
            className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892b0] pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#8892b0] font-mono tracking-wider">
            SORT
          </span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg px-3 py-2.5 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24] cursor-pointer"
          >
            <option value="joined">تاريخ الانضمام</option>
            <option value="drafts">عدد المسوّدات</option>
            <option value="name">الاسم</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-[#8892b0] font-mono">
        {filtered.length === lawyers.length
          ? `${lawyers.length} نتيجة`
          : `${filtered.length} من ${lawyers.length}`}
      </div>

      {/* Table */}
      <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#152a4a]">
              <tr className="text-[11px] font-mono tracking-wider text-right">
                <th className="px-5 py-4" style={{ color: GOLD }}>
                  المحامي
                </th>
                <th
                  className="px-5 py-4 hidden md:table-cell"
                  style={{ color: GOLD }}
                >
                  التخصّص الرئيس
                </th>
                <th
                  className="px-5 py-4 hidden lg:table-cell"
                  style={{ color: GOLD }}
                >
                  الانضمام
                </th>
                <th
                  className="px-5 py-4 text-center"
                  style={{ color: GOLD }}
                >
                  مسوّدات
                </th>
                <th
                  className="px-5 py-4 hidden md:table-cell"
                  style={{ color: GOLD }}
                >
                  آخر نشاط
                </th>
                <th className="px-5 py-4 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-16 text-[#8892b0] text-sm"
                  >
                    {search
                      ? "لا توجد نتائج مطابقة للبحث."
                      : "لا يوجد محامون مسجَّلون بعد."}
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRowNav(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRowNav(l.id);
                      }
                    }}
                    className="border-t border-[#1d3461]/50 hover:bg-[#152a4a]/50 cursor-pointer transition-colors focus:outline-none focus:bg-[#152a4a]"
                  >
                    {/* Lawyer name + email */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[#e6f1ff]">
                          {l.full_name ?? "—"}
                        </span>
                        {l.is_admin && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold tracking-wider"
                            style={{
                              backgroundColor: GOLD,
                              color: "#0a192f",
                            }}
                          >
                            ADMIN
                          </span>
                        )}
                        {!l.has_lawyer_profile && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-mono tracking-wider"
                            style={{
                              backgroundColor: "#8892b020",
                              color: "#8892b0",
                            }}
                            title="لم يكتمل الملفّ الكتابيّ"
                          >
                            غير مكتمل
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8892b0] mt-0.5 font-mono">
                        {l.email}
                      </div>
                    </td>

                    {/* Specialty */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-[#e6f1ff]">
                        {l.primary_specialty ?? (
                          <span className="text-[#8892b0]">—</span>
                        )}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="font-mono text-xs text-[#8892b0]">
                        {formatDate(l.created_at)}
                      </span>
                    </td>

                    {/* Drafts count */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`font-mono font-bold text-lg ${
                          l.drafts_count > 0
                            ? ""
                            : "text-[#8892b0]"
                        }`}
                        style={
                          l.drafts_count > 0 ? { color: GOLD } : undefined
                        }
                      >
                        {l.drafts_count}
                      </span>
                    </td>

                    {/* Last activity */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-[#8892b0]">
                        {l.last_activity
                          ? formatRelative(l.last_activity)
                          : "—"}
                      </span>
                    </td>

                    {/* Action affordance */}
                    <td className="px-5 py-4 text-left whitespace-nowrap">
                      <span
                        className="text-xs font-mono tracking-wider"
                        style={{ color: GOLD }}
                      >
                        عرض ←
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 60) return "الآن";
  if (diffHour < 24) return `قبل ${diffHour} ساعة`;
  if (diffDay < 7) return `قبل ${diffDay} يوم`;
  return formatDate(iso);
}
