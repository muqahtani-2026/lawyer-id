"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminDraftRow,
  DraftFilterOptions,
} from "@/lib/queries/admin-drafts";

const GOLD = "#fbbf24";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "قيد المراجعة", color: "#fbbf24" },
  approved: { label: "مُعتمدة", color: "#4ade80" },
  rejected: { label: "مرفوضة", color: "#ef4444" },
  published: { label: "منشورة", color: "#a78bfa" },
};

const STATUS_OPTIONS = [
  { value: "all", label: "كلّ الحالات" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "مُعتمدة" },
  { value: "rejected", label: "مرفوضة" },
  { value: "published", label: "منشورة" },
];

const DATE_OPTIONS = [
  { value: "all", label: "كلّ الأوقات" },
  { value: "7", label: "آخر 7 أيّام" },
  { value: "30", label: "آخر 30 يوم" },
  { value: "90", label: "آخر 90 يوم" },
];

type Props = {
  drafts: AdminDraftRow[];
  options: DraftFilterOptions;
};

export function DraftsManager({ drafts, options }: Props) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lawyerFilter, setLawyerFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const filtered = useMemo(() => {
    let rows = drafts;

    if (statusFilter !== "all") {
      rows = rows.filter((d) => d.status === statusFilter);
    }
    if (lawyerFilter !== "all") {
      rows = rows.filter((d) => d.user_id === lawyerFilter);
    }
    if (specialtyFilter !== "all") {
      rows = rows.filter((d) => d.specialty_id === specialtyFilter);
    }
    if (dateFilter !== "all") {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date(
        Date.now() - days * 86_400_000
      ).toISOString();
      rows = rows.filter((d) => d.created_at >= cutoff);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (d) =>
          (d.draft_title ?? "").toLowerCase().includes(q) ||
          (d.lawyer_name ?? "").toLowerCase().includes(q) ||
          (d.source_legal_title ?? "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [drafts, search, statusFilter, lawyerFilter, specialtyFilter, dateFilter]);

  const hasFilters =
    statusFilter !== "all" ||
    lawyerFilter !== "all" ||
    specialtyFilter !== "all" ||
    dateFilter !== "all" ||
    search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setLawyerFilter("all");
    setSpecialtyFilter("all");
    setDateFilter("all");
  };

  const handleRowNav = (id: string) => router.push(`/admin/drafts/${id}`);

  return (
    <div className="space-y-4">
      {/* Filters card */}
      <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث بعنوان المسوّدة، اسم المحامي، أو النظام المرجعيّ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a192f] border border-[#1d3461] rounded-lg ps-10 pe-4 py-2.5 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24] transition-colors"
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

        {/* Filter row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FilterSelect
            label="الحالة"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
          />
          <FilterSelect
            label="المحامي"
            value={lawyerFilter}
            onChange={setLawyerFilter}
            options={[
              { value: "all", label: "كلّ المحامين" },
              ...options.lawyers.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
          <FilterSelect
            label="التخصّص"
            value={specialtyFilter}
            onChange={setSpecialtyFilter}
            options={[
              { value: "all", label: "كلّ التخصّصات" },
              ...options.specialties.map((s) => ({
                value: s.id,
                label: s.name_ar,
              })),
            ]}
          />
          <FilterSelect
            label="الفترة"
            value={dateFilter}
            onChange={setDateFilter}
            options={DATE_OPTIONS}
          />
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-mono tracking-wider hover:underline transition-colors"
            style={{ color: GOLD }}
          >
            ✕ مسح كلّ الفلاتر
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-[#8892b0] font-mono">
        {filtered.length === drafts.length
          ? `${drafts.length} نتيجة`
          : `${filtered.length} من ${drafts.length}`}
      </div>

      {/* Table */}
      <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#152a4a]">
              <tr className="text-[11px] font-mono tracking-wider text-right">
                <th className="px-5 py-4" style={{ color: GOLD }}>
                  الحالة
                </th>
                <th className="px-5 py-4" style={{ color: GOLD }}>
                  المسوّدة
                </th>
                <th
                  className="px-5 py-4 hidden md:table-cell"
                  style={{ color: GOLD }}
                >
                  المحامي
                </th>
                <th
                  className="px-5 py-4 hidden lg:table-cell"
                  style={{ color: GOLD }}
                >
                  التخصّص
                </th>
                <th
                  className="px-5 py-4 text-center hidden md:table-cell"
                  style={{ color: GOLD }}
                >
                  الجودة
                </th>
                <th
                  className="px-5 py-4 hidden lg:table-cell"
                  style={{ color: GOLD }}
                >
                  التاريخ
                </th>
                <th className="px-5 py-4 w-px"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-[#8892b0] text-sm"
                  >
                    {hasFilters
                      ? "لا توجد نتائج مطابقة للفلاتر."
                      : drafts.length === 0
                      ? "لا توجد مسوّدات على المنصّة بعد."
                      : "لا توجد نتائج."}
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const status = STATUS_META[d.status] ?? {
                    label: d.status,
                    color: "#8892b0",
                  };
                  return (
                    <tr
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleRowNav(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRowNav(d.id);
                        }
                      }}
                      className="border-t border-[#1d3461]/50 hover:bg-[#152a4a]/50 cursor-pointer transition-colors focus:outline-none focus:bg-[#152a4a]"
                    >
                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className="text-[10px] px-2 py-1 rounded font-mono tracking-wider whitespace-nowrap"
                          style={{
                            backgroundColor: `${status.color}20`,
                            color: status.color,
                          }}
                        >
                          {status.label}
                        </span>
                      </td>

                      {/* Title + source legal */}
                      <td className="px-5 py-4 max-w-md">
                        <div className="text-[#e6f1ff] truncate">
                          {d.draft_title ?? (
                            <span className="text-[#8892b0]">
                              بدون عنوان
                            </span>
                          )}
                        </div>
                        {d.source_legal_title && (
                          <div className="text-xs text-[#8892b0] truncate mt-0.5">
                            مرجع: {d.source_legal_title}
                          </div>
                        )}
                      </td>

                      {/* Lawyer */}
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-[#e6f1ff]">
                          {d.lawyer_name ?? (
                            <span className="text-[#8892b0]">—</span>
                          )}
                        </span>
                      </td>

                      {/* Specialty */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-[#e6f1ff] text-xs">
                          {d.specialty_name ?? (
                            <span className="text-[#8892b0]">—</span>
                          )}
                        </span>
                      </td>

                      {/* Quality */}
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span
                          className="font-mono font-bold text-sm"
                          style={
                            d.quality_score !== null
                              ? { color: qualityColor(d.quality_score) }
                              : { color: "#8892b0" }
                          }
                        >
                          {d.quality_score !== null
                            ? `${d.quality_score}`
                            : "—"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="font-mono text-xs text-[#8892b0]">
                          {formatDate(d.created_at)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-left whitespace-nowrap">
                        <span
                          className="text-xs font-mono tracking-wider"
                          style={{ color: GOLD }}
                        >
                          عرض ←
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wider text-[#8892b0] mb-1.5 font-mono">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0a192f] border border-[#1d3461] rounded-lg px-3 py-2 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24] cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function qualityColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#fbbf24";
  return "#ef4444";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
