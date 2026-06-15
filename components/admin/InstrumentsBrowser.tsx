"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const KIND_LABEL: Record<string, string> = {
  system: "نظام",
  executive_regulation: "لائحة تنفيذية",
  rules: "قواعد",
  agreement: "اتفاقية",
  arrangement: "ترتيب تنظيميّ",
  royal_order: "أمر ملكيّ",
  other: "أخرى",
};

const STATUS_LABEL: Record<string, string> = {
  in_force: "نافذ",
  amended: "مُعدّل",
  repealed: "مُلغى",
  superseded: "محلّ آخر",
  unknown: "غير محدّد",
};

const STATUS_COLOR: Record<string, string> = {
  in_force: "#4ade80",
  amended: "#fbbf24",
  repealed: "#ef4444",
  superseded: "#8892b0",
  unknown: "#8892b0",
};

export type InstrumentRow = {
  id: string;
  canonical_title: string;
  instrument_kind: string;
  specialty_id: string | null;
  specialty_name: string | null;
  first_reference_number: string | null;
  first_issue_date_hijri: string | null;
  status: string;
  event_count: number;
  latest_event_date_hijri: string | null;
  pending_link_count: number;
};

type Option = { id: string; name_ar: string };

export function InstrumentsBrowser({
  rows,
  specialties,
}: {
  rows: InstrumentRow[];
  specialties: Option[];
}) {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const s = search.trim();
    return rows.filter((r) => {
      if (specialty && r.specialty_id !== specialty) return false;
      if (kind && r.instrument_kind !== kind) return false;
      if (status && r.status !== status) return false;
      if (s) {
        const hay = `${r.canonical_title} ${r.first_reference_number ?? ""}`;
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [rows, search, specialty, kind, status]);

  const selectCls =
    "rounded-lg border border-[#1d3461] bg-[#0f1f3d] px-3 py-2 text-sm text-[#e6f1ff] focus:border-[#fbbf24] focus:outline-none";

  return (
    <div className="space-y-4">
      {/* شريط الفلترة والبحث */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم النظام أو رقم المرجع…"
            className="w-full rounded-lg border border-[#1d3461] bg-[#0f1f3d] px-3 py-2 pr-9 text-sm text-[#e6f1ff] placeholder:text-[#8892b0] focus:border-[#fbbf24] focus:outline-none"
          />
          <svg className="absolute right-3 top-2.5 h-4 w-4 text-[#8892b0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={selectCls}>
          <option value="">كلّ المجالات</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>{s.name_ar}</option>
          ))}
        </select>

        <select value={kind} onChange={(e) => setKind(e.target.value)} className={selectCls}>
          <option value="">كلّ الأنواع</option>
          {Object.entries(KIND_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="">كلّ الحالات</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="font-mono text-xs text-[#8892b0]">
        {filtered.length} نظام معروض من أصل {rows.length}
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1d3461] bg-[#0f1f3d] p-10 text-center text-[#8892b0]">
          {rows.length === 0
            ? "لا أنظمة بعد. عند رفع أعداد أم القرى أو ملفّات الأنظمة، تُستنتج الأنظمة وتظهر هنا مع تسلسلها الزمنيّ."
            : "لا نتائج مطابقة للفلتر الحاليّ."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/admin/instruments/${r.id}`}
              className="block rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-4 transition-colors hover:border-[#fbbf24]/50 hover:bg-[#152a4a]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#e6f1ff]">{r.canonical_title}</span>
                    <span className="rounded border border-[#1d3461] px-1.5 py-0.5 font-mono text-[10px] text-[#8892b0]">
                      {KIND_LABEL[r.instrument_kind] ?? r.instrument_kind}
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ color: STATUS_COLOR[r.status], backgroundColor: `${STATUS_COLOR[r.status]}1a` }}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                    {r.specialty_name && <span>المجال: {r.specialty_name}</span>}
                    {r.first_reference_number && (
                      <span className="font-mono" dir="ltr">{r.first_reference_number}</span>
                    )}
                    {r.first_issue_date_hijri && <span>أوّل صدور: {r.first_issue_date_hijri}</span>}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-mono text-sm text-[#4a9eff]">{r.event_count} حدثًا</div>
                  {r.latest_event_date_hijri && (
                    <div className="mt-0.5 text-[10px] text-[#8892b0]">آخر تحديث: {r.latest_event_date_hijri}</div>
                  )}
                  {r.pending_link_count > 0 && (
                    <div className="mt-1 rounded bg-[#fbbf24]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#fbbf24]">
                      {r.pending_link_count} بانتظار تأكيد الربط
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
