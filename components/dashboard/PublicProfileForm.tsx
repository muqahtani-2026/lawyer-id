"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { savePublicProfile } from "@/lib/actions/me";
import type { MyPublicProfile } from "@/lib/queries/me";

export function PublicProfileForm({ initial }: { initial: MyPublicProfile }) {
  const [form, setForm] = useState({
    headline: initial.headline ?? "",
    city: initial.city ?? "",
    bio_long: initial.bio_long ?? "",
    contact_whatsapp: initial.contact_whatsapp ?? "",
    contact_phone: initial.contact_phone ?? "",
    contact_email: initial.contact_email ?? "",
    contact_form_enabled: initial.contact_form_enabled ?? true,
    is_public: initial.is_public ?? false,
  });
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setMsg(null);
    const res = await savePublicProfile(form);
    setPending(false);
    setMsg(res.ok ? "تمّ الحفظ بنجاح." : res.error ?? "خطأ");
  }

  const input =
    "h-10 w-full rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none";

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-line bg-card p-5">
        <label className="flex items-center justify-between">
          <div>
            <div className="font-medium text-content">إظهار ملفي للعامّة</div>
            <div className="text-xs text-muted">عند التفعيل يظهر ملفك في البحث والموقع العام.</div>
          </div>
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            className="h-5 w-5 accent-[#4a9eff]"
          />
        </label>
        {initial.slug && (
          <div className="mt-3 text-xs text-muted">
            رابط ملفك: <span className="font-mono text-lawyer">/pros/{initial.slug}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-card p-5">
        <Field label="العنوان المهنيّ">
          <input className={input} placeholder="مثال: محامٍ متخصّص في القانون التجاريّ"
            value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
        </Field>
        <Field label="المدينة">
          <input className={input} placeholder="الرياض" value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </Field>
        <Field label="نبذة">
          <textarea className={input + " h-auto py-2"} rows={5} placeholder="نبذة تعريفيّة عنك وعن خبرتك…"
            value={form.bio_long} onChange={(e) => setForm({ ...form, bio_long: e.target.value })} />
        </Field>
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-card p-5">
        <div className="font-medium text-content">قنوات التواصل</div>
        <Field label="واتساب (مع رمز الدولة)">
          <input className={input} placeholder="9665xxxxxxxx" dir="ltr" value={form.contact_whatsapp}
            onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} />
        </Field>
        <Field label="جوال">
          <input className={input} placeholder="05xxxxxxxx" dir="ltr" value={form.contact_phone}
            onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
        </Field>
        <Field label="بريد إلكترونيّ">
          <input className={input} placeholder="name@example.com" dir="ltr" value={form.contact_email}
            onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-content">
          <input type="checkbox" checked={form.contact_form_enabled}
            onChange={(e) => setForm({ ...form, contact_form_enabled: e.target.checked })}
            className="h-4 w-4 accent-[#4a9eff]" />
          تفعيل نموذج التواصل عبر المنصّة
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className={buttonClasses("primary", "md")}>
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
