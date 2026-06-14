"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { submitQuestion } from "@/lib/actions/public";

interface FieldOpt {
  id: string;
  name_ar: string;
}

export function AskForm({ fields }: { fields: FieldOpt[] }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ specialtyId: "", title: "", body: "", contact: "" });

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await submitQuestion({
      specialtyId: form.specialtyId || null,
      title: form.title,
      body: form.body,
      askerContact: form.contact || undefined,
    });
    setPending(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "حدث خطأ.");
  }

  if (done) {
    return (
      <div className="rounded-xl border border-success/40 bg-success/10 p-6 text-center">
        <p className="font-semibold text-success">تمّ استلام سؤالك</p>
        <p className="mt-1 text-sm text-muted">
          سيُراجَع السؤال قبل نشره، ثمّ يجيب عليه أحد المختصّين. شكرًا لك.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handle} className="space-y-3 rounded-xl border border-line bg-card p-6">
      <select
        value={form.specialtyId}
        onChange={(e) => setForm({ ...form, specialtyId: e.target.value })}
        className="h-10 w-full rounded-lg border border-line bg-base px-3 text-content focus:border-lawyer focus:outline-none"
      >
        <option value="">اختر المجال (اختياريّ)</option>
        {fields.map((f) => (
          <option key={f.id} value={f.id}>{f.name_ar}</option>
        ))}
      </select>
      <input
        required
        placeholder="عنوان السؤال"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="h-10 w-full rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
      />
      <textarea
        required
        rows={5}
        placeholder="تفاصيل سؤالك (تجنّب ذكر بياناتٍ شخصيّة حسّاسة)"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
        className="w-full rounded-lg border border-line bg-base px-3 py-2 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
      />
      <input
        placeholder="بريدك (اختياريّ — لإشعارك عند الإجابة)"
        value={form.contact}
        onChange={(e) => setForm({ ...form, contact: e.target.value })}
        className="h-10 w-full rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={pending} className={buttonClasses("primary", "md", "w-full")}>
        {pending ? "جارٍ الإرسال…" : "أرسل السؤال"}
      </button>
      <p className="text-xs text-muted">
        الأجوبة تعريفيّة عامّة وليست استشارة. المنصّة لا تقدّم الخدمة المهنيّة بنفسها.
      </p>
    </form>
  );
}
