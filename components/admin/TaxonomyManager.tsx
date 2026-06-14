"use client";

import { useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { upsertField, toggleField } from "@/lib/actions/admin-lam";

interface Field {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  is_active: boolean;
  domain: string | null;
}

export function TaxonomyManager({ initial }: { initial: Field[] }) {
  const [fields, setFields] = useState(initial);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ name_ar: "", name_en: "", slug: "", description: "", domain: "legal" });
  const [msg, setMsg] = useState<string | null>(null);

  const input = "h-10 w-full rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-admin focus:outline-none";

  function add() {
    start(async () => {
      const r = await upsertField(form);
      if (r.ok) {
        setMsg("تمّت الإضافة — حدّث الصفحة لرؤيتها في القائمة.");
        setForm({ name_ar: "", name_en: "", slug: "", description: "", domain: "legal" });
      } else setMsg(r.error ?? "خطأ");
    });
  }

  function flip(id: string, next: boolean) {
    start(async () => {
      const r = await toggleField(id, next);
      if (r.ok) setFields((fs) => fs.map((f) => (f.id === id ? { ...f, is_active: next } : f)));
    });
  }

  return (
    <div className="space-y-6">
      {/* Add new */}
      <div className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold text-content">إضافة مجال</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="الاسم بالعربيّة" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
          <input className={input} placeholder="Name (EN)" dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          <input className={input} placeholder="المعرّف slug (إنجليزيّ)" dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className={input} placeholder="المجال domain (legal/…)" dir="ltr" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <input className={input + " sm:col-span-2"} placeholder="وصف مختصر (اختياريّ)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button disabled={pending} onClick={add} className={buttonClasses("primary", "md")}>إضافة</button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-elevated text-right text-muted">
            <tr>
              <th className="p-3 font-medium">الاسم</th>
              <th className="p-3 font-medium">المعرّف</th>
              <th className="p-3 font-medium">المجال</th>
              <th className="p-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className="border-t border-line bg-card">
                <td className="p-3 text-content">{f.name_ar}</td>
                <td className="p-3 font-mono text-muted" dir="ltr">{f.slug}</td>
                <td className="p-3 text-muted" dir="ltr">{f.domain ?? "—"}</td>
                <td className="p-3">
                  <button onClick={() => flip(f.id, !f.is_active)} disabled={pending}>
                    <Badge tone={f.is_active ? "success" : "neutral"}>{f.is_active ? "نشط" : "معطّل"}</Badge>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
