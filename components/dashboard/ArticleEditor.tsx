"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { publishDraftWithEdits, updateMyArticle } from "@/lib/actions/me";

interface Initial {
  title: string;
  excerpt: string;
  body: string;
  seo_title?: string;
  seo_description?: string;
}

export function ArticleEditor({
  mode,
  draftId,
  articleId,
  initial,
}: {
  mode: "compose" | "edit";
  draftId?: string;
  articleId?: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>({
    title: initial.title ?? "",
    excerpt: initial.excerpt ?? "",
    body: initial.body ?? "",
    seo_title: initial.seo_title ?? "",
    seo_description: initial.seo_description ?? "",
  });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const input =
    "w-full rounded-lg border border-line bg-base px-3 py-2 text-content placeholder:text-muted focus:border-lawyer focus:outline-none";

  async function save() {
    setPending(true);
    setMsg(null);
    const res =
      mode === "compose" && draftId
        ? await publishDraftWithEdits({ draftId, title: form.title, excerpt: form.excerpt, body: form.body })
        : await updateMyArticle({
            id: articleId as string,
            title: form.title,
            excerpt: form.excerpt,
            body: form.body,
            seo_title: form.seo_title,
            seo_description: form.seo_description,
          });
    setPending(false);
    if (res.ok) {
      setMsg("تمّ الحفظ — سيُراجَع قبل الظهور للعامّة.");
      setTimeout(() => router.push("/my-articles"), 900);
    } else {
      setMsg(res.error ?? "خطأ");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-muted">العنوان</span>
        <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">مقتطف (يظهر في القوائم)</span>
        <textarea className={input} rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">المحتوى</span>
        <textarea className={input + " min-h-[280px]"} rows={14} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      </label>

      {mode === "edit" && (
        <details className="rounded-lg border border-line bg-card p-4">
          <summary className="cursor-pointer text-sm text-lawyer">إعدادات SEO (اختياريّة)</summary>
          <div className="mt-3 space-y-3">
            <input className={input} placeholder="عنوان SEO" value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
            <textarea className={input} rows={2} placeholder="وصف SEO" value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} />
          </div>
        </details>
      )}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className={buttonClasses("primary", "md")}>
          {pending ? "جارٍ الحفظ…" : mode === "compose" ? "نشر (بعد المراجعة)" : "حفظ التعديلات"}
        </button>
        <button onClick={() => router.push("/my-articles")} className={buttonClasses("ghost", "md")}>إلغاء</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
      <p className="text-xs text-muted">المقالات تُراجَع من الإدارة قبل ظهورها في الموقع العام.</p>
    </div>
  );
}
