"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { addSample, updateSample, deleteSample } from "@/lib/actions/profile";
import type { WritingSample } from "@/lib/queries/profile";

// ============================================================
// Constants
// ============================================================

const platformOptions = [
  { value: "x", label: "X (تويتر)" },
  { value: "blog", label: "مدوّنة" },
  { value: "linkedin", label: "LinkedIn" },
];

const platformLabels: Record<string, string> = {
  x: "X",
  blog: "مدوّنة",
  linkedin: "LinkedIn",
};

const platformColors: Record<string, string> = {
  x: "bg-[#152a4a] text-[#4a9eff] border-[#4a9eff]/30",
  blog: "bg-[#3a2a0a] text-[#fbbf24] border-[#fbbf24]/30",
  linkedin: "bg-[#0a3a1a] text-[#4ade80] border-[#4ade80]/30",
};

// ============================================================
// Component
// ============================================================

export function SamplesManager({ samples }: { samples: WritingSample[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newPlatform, setNewPlatform] = useState("x");
  const [newNotes, setNewNotes] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const showFeedback = (result: { success: boolean; error?: string }, msg: string) => {
    if (result.success) {
      setSuccess(msg);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } else {
      setError(result.error ?? "خطأ غير متوقَّع");
    }
  };

  const resetAddForm = () => {
    setNewTitle("");
    setNewText("");
    setNewPlatform("x");
    setNewNotes("");
    setShowAddForm(false);
  };

  const handleAdd = () => {
    setError(null);
    startTransition(async () => {
      const sampleType = newPlatform === "x" ? "social" : "blog";
      const result = await addSample({
        title: newTitle,
        sample_text: newText,
        sample_type: sampleType,
        platform_context: newPlatform,
        notes: newNotes,
      });
      if (result.success) {
        resetAddForm();
      }
      showFeedback(result, "تمّت إضافة العيّنة.");
    });
  };

  const startEdit = (s: WritingSample) => {
    setEditingId(s.id);
    setEditTitle(s.title ?? "");
    setEditText(s.sample_text);
    setEditPlatform(s.platform_context ?? "x");
    setEditNotes(s.notes ?? "");
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleEditSave = (sampleId: string) => {
    setError(null);
    startTransition(async () => {
      const sampleType = editPlatform === "x" ? "social" : "blog";
      const result = await updateSample(sampleId, {
        title: editTitle,
        sample_text: editText,
        sample_type: sampleType,
        platform_context: editPlatform,
        notes: editNotes,
      });
      if (result.success) {
        setEditingId(null);
      }
      showFeedback(result, "تمّ تحديث العيّنة.");
    });
  };

  const handleDelete = (sampleId: string) => {
    if (!confirm("هل أنت متأكّد من حذف هذه العيّنة؟")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteSample(sampleId);
      showFeedback(result, "تمّ حذف العيّنة.");
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {(error || success) && (
        <div
          className={cn(
            "p-3 rounded-md border text-sm",
            error
              ? "bg-[#3a0a0a] border-[#ef4444]/30 text-[#ef4444]"
              : "bg-[#0a3a1a] border-[#4ade80]/30 text-[#4ade80]"
          )}
        >
          {error ?? success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-[#e6f1ff] mb-0.5">
            <span className="text-[#4a9eff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {samples.length}
            </span>{" "}
            عيّنة محفوظة
          </p>
          <p className="text-xs text-[#8892b0]">
            GPT يُقلّد أسلوب هذه العيّنات. <span className="text-[#4a9eff]">3 على الأقلّ</span> لاكتمال المِلَفّ.
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] text-white text-sm font-medium rounded-md transition-colors inline-flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            إضافة عيّنة
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <section className="bg-[#0f1f3d] border border-[#4a9eff]/30 rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-medium text-[#e6f1ff] mb-2">عيّنة جديدة</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8892b0] mb-1.5">العنوان (اختياريّ)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={isPending}
                placeholder="مثال: تغريدة عن الإفلاس"
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-[#8892b0] mb-1.5">المنصّة</label>
              <select
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
              >
                {platformOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8892b0] mb-1.5">نصّ العيّنة *</label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={6}
              maxLength={5000}
              disabled={isPending}
              placeholder="الصق نصًّا كاملًا من كتاباتك السابقة..."
              className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none leading-loose"
            />
            <div className="text-xs text-[#8892b0] mt-1 text-left" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {newText.length} / 5000
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#8892b0] mb-1.5">ملاحظات (اختياريّ)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              disabled={isPending}
              placeholder="مثال: حصدت تفاعلًا عاليًا"
              className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={resetAddForm}
              disabled={isPending}
              className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !newText.trim()}
              className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
            >
              {isPending ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </section>
      )}

      {/* Samples List */}
      {samples.length === 0 ? (
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#152a4a] mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="10" y1="13" x2="14" y2="13" />
              <line x1="10" y1="17" x2="14" y2="17" />
            </svg>
          </div>
          <h3 className="text-base text-[#e6f1ff] font-medium mb-2">لا توجد عيّنات بعد</h3>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            أضف 3 عيّنات على الأقلّ من كتاباتك السابقة كي يقلّد GPT أسلوبك بدقّة.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {samples.map((s) => {
            const isEditing = editingId === s.id;
            const platformKey = s.platform_context ?? "x";

            if (isEditing) {
              return (
                <li key={s.id} className="bg-[#0f1f3d] border border-[#4a9eff]/30 rounded-lg p-5 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={isPending}
                      placeholder="العنوان"
                      className="px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
                    />
                    <select
                      value={editPlatform}
                      onChange={(e) => setEditPlatform(e.target.value)}
                      disabled={isPending}
                      className="px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
                    >
                      {platformOptions.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={6}
                    maxLength={5000}
                    disabled={isPending}
                    className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none leading-loose"
                  />
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    disabled={isPending}
                    placeholder="ملاحظات (اختياريّ)"
                    className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
                  />
                  <div className="flex items-center gap-2 justify-end pt-1">
                    <button
                      onClick={cancelEdit}
                      disabled={isPending}
                      className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={() => handleEditSave(s.id)}
                      disabled={isPending || !editText.trim()}
                      className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
                    >
                      {isPending ? "..." : "حفظ"}
                    </button>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={s.id}
                className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-4 hover:border-[#2d4a7d] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded border whitespace-nowrap",
                          platformColors[platformKey] ?? platformColors.x
                        )}
                      >
                        {platformLabels[platformKey] ?? platformKey}
                      </span>
                      {s.title && (
                        <h4 className="text-sm text-[#e6f1ff] font-medium">{s.title}</h4>
                      )}
                    </div>
                    <p className="text-sm text-[#e6f1ff] line-clamp-3 leading-relaxed mb-2">
                      {s.sample_text}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-[#8892b0] italic">📝 {s.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#1d3461]">
                  <button
                    onClick={() => startEdit(s)}
                    disabled={isPending}
                    className="text-xs px-3 py-1 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] rounded transition-colors"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={isPending}
                    className="text-xs px-3 py-1 bg-[#3a0a0a]/40 hover:bg-[#3a0a0a] border border-[#ef4444]/30 text-[#ef4444] rounded transition-colors"
                  >
                    حذف
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
