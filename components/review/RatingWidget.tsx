"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { submitFeedback, getMyFeedbackForDraft } from "@/lib/actions/feedback";

interface RatingWidgetProps {
  draftId: string;
  initialRating?: number | null;
  initialComment?: string | null;
  initialWouldPublish?: boolean | null;
}

export function RatingWidget({
  draftId,
  initialRating = null,
  initialComment = null,
  initialWouldPublish = null,
}: RatingWidgetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rating, setRating] = useState<number>(initialRating ?? 0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState<string>(initialComment ?? "");
  const [wouldPublish, setWouldPublish] = useState<boolean | null>(initialWouldPublish);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [alreadyRated, setAlreadyRated] = useState<boolean>(initialRating != null);
  // إن لم يمرّر الخادم تقييمًا مسبقًا، نجلبه ذاتيًّا عند المونت
  const [loading, setLoading] = useState<boolean>(initialRating == null);

  const activeStars = hover || rating;

  // pre-fill: جلب التقييم السابق (إن وُجد) لهذه المسوّدة لهذا المستخدم
  useEffect(() => {
    if (initialRating != null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const existing = await getMyFeedbackForDraft(draftId);
      if (cancelled) return;
      if (existing) {
        setRating(existing.rating ?? 0);
        setComment(existing.comment ?? "");
        setWouldPublish(existing.would_publish ?? null);
        setAlreadyRated(true);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId, initialRating]);

  const handleSubmit = () => {
    setError(null);
    if (rating < 1) {
      setError("اختر تقييمًا من 1 إلى 5 أوّلًا.");
      return;
    }
    startTransition(async () => {
      const result = await submitFeedback(draftId, rating, comment, wouldPublish);
      if (result.success) {
        setAlreadyRated(true);
        setSuccess(alreadyRated ? "تم تحديث تقييمك." : "شكرًا — تم حفظ تقييمك.");
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
        router.refresh();
      } else {
        setError(result.error ?? "خطأ غير متوقَّع");
        setSuccess(null);
      }
    });
  };

  const disabled = isPending || loading;

  return (
    <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-4 md:p-6 space-y-5">
      <div>
        <h2
          className="text-lg font-bold text-[#e6f1ff] mb-1"
          style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
        >
          قيّم هذه المسوّدة
        </h2>
        <p className="text-xs text-[#8892b0]">تقييمك يساعدنا على تحسين جودة المحتوى المُولَّد لك.</p>
      </div>

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

      {/* النجوم 1–5 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#8892b0]">الجودة:</span>
        <div className="flex items-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              disabled={disabled}
              aria-label={`${star} من 5`}
              className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={star <= activeStars ? "#fbbf24" : "none"}
                stroke={star <= activeStars ? "#fbbf24" : "#1d3461"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm text-[#fbbf24]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {rating}/5
          </span>
        )}
      </div>

      {/* هل ستنشرها؟ */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-[#8892b0]">هل ستنشرها؟</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWouldPublish(wouldPublish === true ? null : true)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              wouldPublish === true
                ? "bg-[#0a3a1a] border-[#4ade80]/40 text-[#4ade80]"
                : "bg-[#152a4a] border-[#1d3461] text-[#8892b0] hover:text-[#e6f1ff]"
            )}
          >
            نعم
          </button>
          <button
            type="button"
            onClick={() => setWouldPublish(wouldPublish === false ? null : false)}
            disabled={disabled}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border transition-colors",
              wouldPublish === false
                ? "bg-[#3a0a0a] border-[#ef4444]/40 text-[#ef4444]"
                : "bg-[#152a4a] border-[#1d3461] text-[#8892b0] hover:text-[#e6f1ff]"
            )}
          >
            لا
          </button>
        </div>
      </div>

      {/* تعليق */}
      <div>
        <label className="block text-xs text-[#8892b0] mb-1.5">تعليق (اختياريّ)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="ما الذي أعجبك أو ينقص هذه المسوّدة؟"
          disabled={disabled}
          className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors resize-none leading-relaxed"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || rating < 1}
          className="px-4 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
        >
          {isPending
            ? "جاري الحفظ..."
            : loading
              ? "جاري التحميل..."
              : alreadyRated
                ? "تحديث التقييم"
                : "إرسال التقييم"}
        </button>
      </div>
    </div>
  );
}
