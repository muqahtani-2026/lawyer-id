"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { updateProfile } from "@/lib/actions/profile";
import type { FullProfile } from "@/lib/queries/profile";

// ============================================================
// Options
// ============================================================

const writingStyleOptions = [
  { value: "formal", label: "رسميّ", desc: "صياغة قانونيّة دقيقة. للقطاع المهنيّ." },
  { value: "friendly", label: "وديّ", desc: "نبرة قريبة. للجمهور العامّ." },
  { value: "educational", label: "تعليميّ", desc: "يشرح بالأمثلة. للمبتدئين." },
  { value: "analytical", label: "تحليليّ", desc: "يستخرج الدروس. للزملاء المختصّين." },
  { value: "concise", label: "مُختصر", desc: "نقاط مكثّفة. للتغريدات." },
];

const preferredLengthOptions = [
  { value: "short_tweet", label: "تغريدة قصيرة", desc: "≤ 50 كلمة" },
  { value: "medium_post", label: "منشور متوسّط", desc: "100 – 250 كلمة" },
  { value: "long_article", label: "مقالة طويلة", desc: "400 – 800 كلمة" },
];

// ============================================================
// Component
// ============================================================

export function ProfileForm({ profile }: { profile: FullProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [targetAudience, setTargetAudience] = useState(profile.target_audience ?? "");
  const [writingStyle, setWritingStyle] = useState(profile.writing_style ?? "");
  const [preferredLength, setPreferredLength] = useState(profile.preferred_length ?? "");
  const [favoritePhrases, setFavoritePhrases] = useState<string[]>(profile.favorite_phrases ?? []);
  const [avoidedPhrases, setAvoidedPhrases] = useState<string[]>(profile.avoided_phrases ?? []);
  const [styleNotes, setStyleNotes] = useState(profile.style_notes ?? "");

  const [newFav, setNewFav] = useState("");
  const [newAvoid, setNewAvoid] = useState("");

  const addFav = () => {
    const trimmed = newFav.trim();
    if (trimmed && !favoritePhrases.includes(trimmed) && favoritePhrases.length < 50) {
      setFavoritePhrases([...favoritePhrases, trimmed]);
      setNewFav("");
    }
  };
  const removeFav = (p: string) => setFavoritePhrases(favoritePhrases.filter((x) => x !== p));

  const addAvoid = () => {
    const trimmed = newAvoid.trim();
    if (trimmed && !avoidedPhrases.includes(trimmed) && avoidedPhrases.length < 50) {
      setAvoidedPhrases([...avoidedPhrases, trimmed]);
      setNewAvoid("");
    }
  };
  const removeAvoid = (p: string) => setAvoidedPhrases(avoidedPhrases.filter((x) => x !== p));

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateProfile({
        target_audience: targetAudience,
        writing_style: writingStyle,
        preferred_length: preferredLength,
        favorite_phrases: favoritePhrases,
        avoided_phrases: avoidedPhrases,
        style_notes: styleNotes,
      });
      if (result.success) {
        setSuccess("تمّ حفظ التعديلات.");
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        setError(result.error ?? "خطأ غير متوقَّع");
      }
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

      {/* Target Audience */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <label className="block text-sm font-medium text-[#e6f1ff] mb-2">
          الجمهور المُستهدَف
        </label>
        <p className="text-xs text-[#8892b0] mb-3">
          من تكتب لهم عادةً؟ (مثال: شركات ناشئة، أفراد، محامون...)
        </p>
        <textarea
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          rows={2}
          disabled={isPending}
          placeholder="مثال: شركات ناشئة وروّاد أعمال"
          className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none leading-relaxed"
        />
      </section>

      {/* Writing Style */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <label className="block text-sm font-medium text-[#e6f1ff] mb-2">
          أُسلوب الكِتابة
        </label>
        <p className="text-xs text-[#8892b0] mb-3">
          النبرة الافتراضيّة للمسوّدات المُولَّدة.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {writingStyleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWritingStyle(opt.value)}
              disabled={isPending}
              className={cn(
                "text-right p-3 rounded-md border transition-colors",
                writingStyle === opt.value
                  ? "border-[#4a9eff] bg-[#152a4a]"
                  : "border-[#1d3461] bg-[#0a192f] hover:border-[#2d4a7d]"
              )}
            >
              <div className="text-sm font-medium text-[#e6f1ff] mb-0.5">{opt.label}</div>
              <div className="text-xs text-[#8892b0] leading-relaxed">{opt.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Preferred Length */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <label className="block text-sm font-medium text-[#e6f1ff] mb-2">
          الطول المُفضَّل
        </label>
        <p className="text-xs text-[#8892b0] mb-3">
          الحجم الافتراضيّ للمسوّدة الواحدة.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {preferredLengthOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPreferredLength(opt.value)}
              disabled={isPending}
              className={cn(
                "text-right p-3 rounded-md border transition-colors",
                preferredLength === opt.value
                  ? "border-[#4a9eff] bg-[#152a4a]"
                  : "border-[#1d3461] bg-[#0a192f] hover:border-[#2d4a7d]"
              )}
            >
              <div className="text-sm font-medium text-[#e6f1ff] mb-0.5">{opt.label}</div>
              <div className="text-xs text-[#8892b0]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Favorite Phrases */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <label className="block text-sm font-medium text-[#e6f1ff] mb-2">
          عبارات مُفضَّلة
        </label>
        <p className="text-xs text-[#8892b0] mb-3">
          تظهر بطبيعيّة في مسوّداتك. <span className="text-[#4a9eff]">3 على الأقلّ</span> لاكتمال المِلَفّ.
        </p>
        <div className="flex flex-wrap gap-2 min-h-[36px] mb-3">
          {favoritePhrases.length === 0 ? (
            <span className="text-xs text-[#8892b0]">لا توجد عبارات بعد.</span>
          ) : (
            favoritePhrases.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#152a4a] border border-[#1d3461] rounded-full text-sm text-[#e6f1ff]"
              >
                {p}
                <button
                  type="button"
                  onClick={() => removeFav(p)}
                  disabled={isPending}
                  className="text-[#8892b0] hover:text-[#ef4444] transition-colors"
                  aria-label="حذف"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newFav}
            onChange={(e) => setNewFav(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFav();
              }
            }}
            disabled={isPending || favoritePhrases.length >= 50}
            placeholder='مثال: "ما لا يعرفه كثيرون"'
            className="flex-1 px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
          />
          <button
            type="button"
            onClick={addFav}
            disabled={isPending || !newFav.trim() || favoritePhrases.length >= 50}
            className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] disabled:bg-[#0a192f] disabled:text-[#8892b0] text-[#e6f1ff] text-sm rounded-md transition-colors"
          >
            إضافة
          </button>
        </div>
      </section>

      {/* Avoided Phrases */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <label className="block text-sm font-medium text-[#e6f1ff] mb-2">
          عبارات مُتجنَّبة
        </label>
        <p className="text-xs text-[#8892b0] mb-3">
          GPT سيتجنّبها في المسوّدات. <span className="text-[#4a9eff]">3 على الأقلّ</span> لاكتمال المِلَفّ.
        </p>
        <div className="flex flex-wrap gap-2 min-h-[36px] mb-3">
          {avoidedPhrases.length === 0 ? (
            <span className="text-xs text-[#8892b0]">لا توجد عبارات بعد.</span>
          ) : (
            avoidedPhrases.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3a0a0a]/40 border border-[#ef4444]/30 rounded-full text-sm text-[#e6f1ff]"
              >
                {p}
                <button
                  type="button"
                  onClick={() => removeAvoid(p)}
                  disabled={isPending}
                  className="text-[#8892b0] hover:text-[#ef4444] transition-colors"
                  aria-label="حذف"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newAvoid}
            onChange={(e) => setNewAvoid(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAvoid();
              }
            }}
            disabled={isPending || avoidedPhrases.length >= 50}
            placeholder='مثال: "بكلّ تأكيد"'
            className="flex-1 px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
          />
          <button
            type="button"
            onClick={addAvoid}
            disabled={isPending || !newAvoid.trim() || avoidedPhrases.length >= 50}
            className="px-4 py-2 bg-[#152a4a] hover:bg-[#1d3461] disabled:bg-[#0a192f] disabled:text-[#8892b0] text-[#e6f1ff] text-sm rounded-md transition-colors"
          >
            إضافة
          </button>
        </div>
      </section>

      {/* Style Notes */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <label className="block text-sm font-medium text-[#e6f1ff] mb-2">
          ملاحظات الأسلوب
        </label>
        <p className="text-xs text-[#8892b0] mb-3">
          نصّ حرّ عن أسلوبك (مثال: "أبدأ بسؤال يستفزّ التفكير، وأختم بسؤال للمتابعين").
        </p>
        <textarea
          value={styleNotes}
          onChange={(e) => setStyleNotes(e.target.value)}
          rows={4}
          disabled={isPending}
          placeholder="اكتب ملاحظات حرّة عن أسلوبك في الكتابة..."
          className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none leading-relaxed"
        />
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-4 flex items-center justify-between gap-3 shadow-lg">
        <span className="text-xs text-[#8892b0]">
          التعديلات تنعكس على الـ Dashboard فورًا.
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
        >
          {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
        </button>
      </div>
    </div>
  );
}
