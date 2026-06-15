"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { requestStudioGeneration } from "@/lib/actions/me";

type Source = { id: string; title: string; reference_number: string | null };

const FORMATS = [
  { value: "x_short", label: "منشور X قصير" },
  { value: "linkedin_medium", label: "منشور LinkedIn متوسّط" },
  { value: "article_long", label: "مقال مطوّل" },
];
const TONES = [
  { value: "analytical", label: "تحليليّة" },
  { value: "educational", label: "تعليميّة" },
  { value: "friendly", label: "ودودة" },
  { value: "formal", label: "رسميّة" },
  { value: "concise", label: "موجزة" },
];

export function StudioForm({ sources, locked }: { sources: Source[]; locked: boolean }) {
  const [sourceId, setSourceId] = useState("");
  const [format, setFormat] = useState("linkedin_medium");
  const [tone, setTone] = useState("analytical");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate() {
    setPending(true); setMsg(null); setDone(false);
    const res = await requestStudioGeneration({ legalSourceId: sourceId, contentFormat: format, tone });
    setPending(false);
    if (res.ok) { setDone(true); setMsg("تمّ إرسال طلب التوليد ✓ ستظهر المسوّدة في «المراجعة» خلال دقائق."); }
    else setMsg(res.error ?? "خطأ");
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-warning/40 bg-warning/5 p-5 text-sm text-content">
        حسابك بانتظار الاعتماد. سيُفعَّل استوديو المحتوى بعد مراجعة وثيقتك والموافقة عليها.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border border-line bg-card p-5 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-content">المصدر النظاميّ</label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-base px-3 text-content focus:border-lawyer focus:outline-none"
          >
            <option value="">— اتركه للمولّد ليختار التالي —</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.title}{s.reference_number ? ` (${s.reference_number})` : ""}</option>
            ))}
          </select>
          {sources.length === 0 && (
            <p className="mt-1 text-xs text-muted">لا توجد أنظمة في تخصّصك بعد — ستُضاف عبر «جلب الأنظمة» في الإدارة.</p>
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm text-content">الصيغة</span>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button key={f.value} type="button" onClick={() => setFormat(f.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${format === f.value ? "border-lawyer bg-lawyer/10 text-content" : "border-line text-muted hover:border-lawyer"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1 block text-sm text-content">النبرة</span>
          <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
              <button key={t.value} type="button" onClick={() => setTone(t.value)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${tone === t.value ? "border-lawyer bg-lawyer/10 text-content" : "border-line text-muted hover:border-lawyer"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button onClick={generate} disabled={pending} className={buttonClasses("primary", "md")}>
            {pending ? "جارٍ الإرسال…" : "✦ توليد المسوّدة"}
          </button>
          {done && <Link href="/review" className="text-sm text-lawyer hover:underline">الذهاب إلى المراجعة ←</Link>}
        </div>
        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>

      <p className="text-xs text-muted">
        ملاحظة: التوليد يتمّ بأسلوبك المحفوظ في «أسلوبي»، ويعتمد على الأنظمة الموثّقة فقط. تظهر النتيجة في «المراجعة» لاعتمادها أو تعديلها قبل النشر.
      </p>
    </div>
  );
}
