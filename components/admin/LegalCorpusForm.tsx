"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  CorpusFormData,
} from "@/lib/actions/admin-legal-corpus";
import type {
  LegalCorpusDetail,
  LegalCorpusFormOptions,
} from "@/lib/queries/admin-legal-corpus";
import {
  createLegalCorpus,
  updateLegalCorpus,
} from "@/lib/actions/admin-legal-corpus";

const GOLD = "#fbbf24";

type Props = {
  initial?: LegalCorpusDetail;
  options: LegalCorpusFormOptions;
  mode: "create" | "edit";
};

export function LegalCorpusForm({ initial, options, mode }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CorpusFormData>({
    title: initial?.title ?? "",
    document_type: initial?.document_type ?? "",
    source_authority: initial?.source_authority ?? "",
    specialty_id: initial?.specialty_id ?? "",
    full_text: initial?.full_text ?? "",
    summary: initial?.summary ?? "",
    reference_number: initial?.reference_number ?? "",
    issue_date: initial?.issue_date ?? "",
    effective_date: initial?.effective_date ?? "",
    source_url: initial?.source_url ?? "",
    tags: initial?.tags ?? [],
  });

  const [tagInput, setTagInput] = useState("");

  const update = <K extends keyof CorpusFormData>(
    key: K,
    value: CorpusFormData[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (form.tags.includes(t)) {
      setTagInput("");
      return;
    }
    update("tags", [...form.tags, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    update(
      "tags",
      form.tags.filter((t) => t !== tag)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createLegalCorpus(form)
          : await updateLegalCorpus(initial!.id, form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (mode === "create" && (result.data as { id?: string })?.id) {
        router.push(`/admin/legal-corpus/${(result.data as { id: string }).id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error banner */}
      {error && (
        <div
          className="rounded-xl p-4 text-sm border"
          style={{
            backgroundColor: "#ef444415",
            borderColor: "#ef444466",
            color: "#fca5a5",
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <SectionTitle>BASIC INFO</SectionTitle>

        <div className="space-y-4">
          <Field
            label="عنوان النظام *"
            required
            placeholder="مثلاً: نظام الشركات"
            value={form.title}
            onChange={(v) => update("title", v)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="نوع الوثيقة"
              placeholder="مثلاً: نظام / لائحة / قرار"
              value={form.document_type ?? ""}
              onChange={(v) => update("document_type", v || null)}
            />
            <Field
              label="الجهة المُصدِرة"
              placeholder="مثلاً: مجلس الوزراء"
              value={form.source_authority ?? ""}
              onChange={(v) => update("source_authority", v || null)}
            />
          </div>

          <SelectField
            label="التخصّص"
            value={form.specialty_id ?? ""}
            onChange={(v) => update("specialty_id", v || null)}
            options={[
              { value: "", label: "— بلا تخصّص —" },
              ...options.specialties.map((s) => ({
                value: s.id,
                label: s.name_ar,
              })),
            ]}
          />
        </div>
      </Card>

      {/* Reference */}
      <Card>
        <SectionTitle>REFERENCE</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field
            label="الرقم المرجعيّ"
            placeholder="مثلاً: م/3"
            value={form.reference_number ?? ""}
            onChange={(v) => update("reference_number", v || null)}
            mono
          />
          <Field
            label="تاريخ الإصدار"
            type="date"
            value={form.issue_date ?? ""}
            onChange={(v) => update("issue_date", v || null)}
            mono
          />
          <Field
            label="تاريخ النفاذ"
            type="date"
            value={form.effective_date ?? ""}
            onChange={(v) => update("effective_date", v || null)}
            mono
          />
        </div>

        <div className="mt-4">
          <Field
            label="رابط المصدر الرسميّ"
            type="url"
            placeholder="https://..."
            value={form.source_url ?? ""}
            onChange={(v) => update("source_url", v || null)}
            mono
          />
        </div>
      </Card>

      {/* Content */}
      <Card>
        <SectionTitle>CONTENT</SectionTitle>

        <div className="space-y-4">
          <TextareaField
            label="ملخّص (اختياريّ)"
            placeholder="ملخّص قصير عن النظام..."
            value={form.summary ?? ""}
            onChange={(v) => update("summary", v || null)}
            rows={3}
          />

          <TextareaField
            label="النصّ الكامل *"
            required
            placeholder="النصّ الكامل للنظام كما هو في الجريدة الرسميّة..."
            value={form.full_text}
            onChange={(v) => update("full_text", v)}
            rows={14}
          />
        </div>
      </Card>

      {/* Tags */}
      <Card>
        <SectionTitle>TAGS</SectionTitle>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="اكتب وسمًا ثمّ Enter..."
            className="flex-1 bg-[#0a192f] border border-[#1d3461] rounded-lg px-3 py-2 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24]"
          />
          <button
            type="button"
            onClick={addTag}
            className="text-xs font-mono px-4 py-2 rounded-lg border transition-colors"
            style={{
              borderColor: `${GOLD}66`,
              color: GOLD,
            }}
          >
            إضافة +
          </button>
        </div>

        {form.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded border flex items-center gap-1.5"
                style={{
                  backgroundColor: `${GOLD}15`,
                  borderColor: `${GOLD}33`,
                  color: "#fde68a",
                }}
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="hover:text-red-400 transition-colors"
                  title="حذف"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#8892b0]">لا توجد وسوم بعد.</p>
        )}
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.push("/admin/legal-corpus")}
          className="text-sm px-5 py-2.5 rounded-lg border border-[#1d3461] hover:bg-[#152a4a] transition-colors text-[#8892b0]"
          disabled={pending}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          style={{
            backgroundColor: GOLD,
            color: "#0a192f",
          }}
        >
          {pending
            ? "...جاري الحفظ"
            : mode === "create"
            ? "إنشاء النظام"
            : "حفظ التغييرات"}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// Sub-components
// ============================================================

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-xs font-mono tracking-[1.5px] mb-5"
      style={{ color: GOLD }}
    >
      {children}
    </h3>
  );
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-[11px] uppercase tracking-wider text-[#8892b0] mb-1.5 font-mono">
      {children}
      {required && <span className="text-[#fbbf24] ms-1">*</span>}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={type === "url" || type === "date" || mono ? "ltr" : undefined}
        className={`w-full bg-[#0a192f] border border-[#1d3461] rounded-lg px-3 py-2 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24] ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="w-full bg-[#0a192f] border border-[#1d3461] rounded-lg px-3 py-2 text-sm text-[#e6f1ff] focus:outline-none focus:border-[#fbbf24] leading-relaxed resize-y"
      />
    </div>
  );
}

function SelectField({
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
      <FieldLabel>{label}</FieldLabel>
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
