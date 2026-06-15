"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { saveNotificationPrefs } from "@/lib/actions/me";
import type { MyNotificationPrefs } from "@/lib/queries/me";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg border border-line bg-base px-4 py-3 text-right"
    >
      <span className="text-content">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-lawyer" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-0.5" : "left-[22px]"}`} />
      </span>
    </button>
  );
}

const HOURS = [6, 7, 8, 9, 12, 13, 17, 20];

export function SettingsForm({ initial, email, xConnected }: { initial: MyNotificationPrefs; email: string | null; xConnected: boolean }) {
  const [f, setF] = useState(initial);
  const [hour, setHour] = useState(initial.preferred_send_hour ?? 8);
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setPending(true); setMsg(null);
    const res = await saveNotificationPrefs({
      email_enabled: f.email_enabled,
      notify_on_lead: f.notify_on_lead,
      notify_on_question: f.notify_on_question,
      weekly_digest: f.weekly_digest,
      preferred_send_hour: hour,
    });
    setPending(false);
    setMsg(res.ok ? "تمّ الحفظ ✓" : res.error ?? "خطأ");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold text-content">الحساب</h2>
        <p className="text-sm text-muted">البريد: <span dir="ltr" className="font-mono text-content">{email ?? "—"}</span></p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-content">الإشعارات</h2>
        <Toggle checked={f.email_enabled} onChange={(v) => setF({ ...f, email_enabled: v })} label="تفعيل إشعارات البريد" />
        <Toggle checked={f.notify_on_lead} onChange={(v) => setF({ ...f, notify_on_lead: v })} label="إشعار عند وصول عميل محتمل" />
        <Toggle checked={f.notify_on_question} onChange={(v) => setF({ ...f, notify_on_question: v })} label="إشعار عند سؤال جديد في مجالي" />
        <Toggle checked={f.weekly_digest} onChange={(v) => setF({ ...f, weekly_digest: v })} label="ملخّص أسبوعيّ بالبريد" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-content">وقت الجدولة المفضّل</h2>
        <div className="flex flex-wrap gap-2">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHour(h)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${hour === h ? "border-lawyer bg-lawyer/10 text-content" : "border-line text-muted hover:border-lawyer"}`}
            >
              {h <= 12 ? `${h}:00 صباحًا` : `${h - 12}:00 مساءً`}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-content">ربط الحسابات (للنشر التلقائيّ — Pro)</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/connect/x" className={buttonClasses("outline", "md")}>
            X (تويتر) — {xConnected ? "متّصل ✓" : "ربط"}
          </Link>
          <span className={buttonClasses("ghost", "md") + " opacity-60"}>LinkedIn — قريبًا</span>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending} className={buttonClasses("primary", "md")}>
          {pending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </div>
  );
}
