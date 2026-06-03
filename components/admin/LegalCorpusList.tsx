"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  LegalCorpusRow,
  LegalCorpusFormOptions,
} from "@/lib/queries/admin-legal-corpus";
import { toggleCorpusActive } from "@/lib/actions/admin-legal-corpus";

const GOLD = "#fbbf24";

const STATUS_OPTIONS = [
  { value: "all", label: "الكلّ" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "مُعطَّل" },
];

type Props = {
  corpus: LegalCorpusRow[];
  options: LegalCorpusFormOptions;
};

export function LegalCorpusList({ corpus, options }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");

  const filtered = useMemo(() => {
    let rows = corpus;

    if (statusFilter === "active") {
      rows = rows.filter((r) => r.is_active);
    } else if (statusFilter === "inactive") {
      rows = rows.filter((r) => !r.is_active);
    }

    if (specialtyFilter !== "all") {
      rows = rows.filter((r) => r.specialty_id === specialtyFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.reference_number ?? "").toLowerCase().includes(q) ||
          (r.source_authority ?? "").toLowerCase().includes(q) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return rows;
  }, [corpus, search, statusFilter, specialtyFilter]);

  const hasFilters =
    statusFilter !== "all" || specialtyFilter !== "all" || search.trim() !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSpecialtyFilter("all");
  };

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleCorpusActive(id, !current);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Top row: search + new button */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث بالعنوان، الرقم المرجعيّ، الجهة، أو الوسوم..."
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

        <Link
          href="/admin/legal-corpus/new"
          className="text-sm font-medium px-5 py-2.5 rounded-lg whitespace-nowrap transition-colors"
          style={{
            backgroundColor: GOLD,
            color: "#0a192f",
          }}
        >
          + إضافة نظام جديد
        </Link>
      </div>

      {/* Filter row */}
      <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FilterSelect
            label="الحالة"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
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
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="mt-3 text-xs font-mono tracking-wider hover:underline transition-colors"
            style={{ color: GOLD }}
          >
            ✕ مسح كلّ الفلاتر
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-[#8892b0] font-mono">
        {filtered.length === corpus.length
          ? `${corpus.length} نظام`
          : `${filtered.length} من ${corpus.length}`}
      </div>

      {/* Table */}
      <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#152a4a]">
              <tr className="text-[11px] font-mono tracking-wider text-right">
                <th className="px-5 py-4" style={{ color: GOLD }}>
                  النظام
                </th>
                <th
                  className="px-5 py-4 hidden md:table-cell"
                  style={{ color: GOLD }}
                >
                  المرجع
                </th>
                <th
                  className="px-5 py-4 hidden lg:table-cell"
                  style={{ color: GOLD }}
                >
                  التخصّص
                </th>
                <th
                  className="px-5 py-4 text-center"
                  style={{ color: GOLD }}
                >
                  مسوّدات
                </th>
                <th className="px-5 py-4 text-center" style={{ color: GOLD }}>
                  الحالة
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
                    {hasFilters
                      ? "لا توجد نتائج مطابقة للفلاتر."
                      : "لا توجد أنظمة بعد. اضغط « إضافة نظام جديد »."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-[#1d3461]/50 hover:bg-[#152a4a]/50 transition-colors"
                  >
                    {/* Title + source authority + tags */}
                    <td
                      className="px-5 py-4 cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/legal-corpus/${c.id}`)
                      }
                    >
                      <div className="text-[#e6f1ff] font-medium leading-tight">
                        {c.title}
                      </div>
                      {c.source_authority && (
                        <div className="text-xs text-[#8892b0] mt-1">
                          {c.source_authority}
                        </div>
                      )}
                      {c.tags && c.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.tags.slice(0, 4).map((t, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a192f] border border-[#1d3461] text-[#8892b0]"
                            >
                              {t}
                            </span>
                          ))}
                          {c.tags.length > 4 && (
                            <span className="text-[10px] text-[#8892b0]">
                              +{c.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Reference number */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="font-mono text-xs text-[#e6f1ff]">
                        {c.reference_number ?? (
                          <span className="text-[#8892b0]">—</span>
                        )}
                      </span>
                    </td>

                    {/* Specialty */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-xs text-[#e6f1ff]">
                        {c.specialty_name ?? (
                          <span className="text-[#8892b0]">—</span>
                        )}
                      </span>
                    </td>

                    {/* Drafts count */}
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`font-mono font-bold ${
                          c.drafts_count > 0 ? "" : "text-[#8892b0]"
                        }`}
                        style={
                          c.drafts_count > 0
                            ? { color: GOLD }
                            : undefined
                        }
                      >
                        {c.drafts_count}
                      </span>
                    </td>

                    {/* Active toggle */}
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() =>
                          handleToggleActive(c.id, c.is_active)
                        }
                        className="text-[10px] px-2 py-1 rounded font-mono tracking-wider transition-colors hover:opacity-80"
                        style={
                          c.is_active
                            ? {
                                backgroundColor: "#4ade8020",
                                color: "#4ade80",
                              }
                            : {
                                backgroundColor: "#8892b020",
                                color: "#8892b0",
                              }
                        }
                        title={
                          c.is_active
                            ? "اضغط لتعطيل"
                            : "اضغط لإعادة التفعيل"
                        }
                      >
                        {c.is_active ? "نشط" : "مُعطَّل"}
                      </button>
                    </td>

                    {/* Edit */}
                    <td className="px-5 py-4 text-left whitespace-nowrap">
                      <Link
                        href={`/admin/legal-corpus/${c.id}`}
                        className="text-xs font-mono tracking-wider hover:underline transition-colors"
                        style={{ color: GOLD }}
                      >
                        تحرير ←
                      </Link>
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
