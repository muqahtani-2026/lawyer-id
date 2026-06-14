"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { submitLead, logContactClick } from "@/lib/actions/public";

interface Props {
  professionalId: string;
  name: string;
  whatsapp?: string | null;
  phone?: string | null;
  email?: string | null;
  formEnabled?: boolean | null;
  source?: "profile" | "article";
  sourceArticleId?: string | null;
}

export function ContactPanel({
  professionalId,
  name,
  whatsapp,
  phone,
  email,
  formEnabled,
  source = "profile",
  sourceArticleId = null,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });

  function track(channel: "whatsapp" | "call" | "email") {
    void logContactClick(professionalId, channel);
    void submitLead({ professionalId, channel, source, sourceArticleId });
  }

  async function handleForm(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await submitLead({
      professionalId,
      channel: "form",
      source,
      sourceArticleId,
      visitorName: form.name,
      visitorContact: form.contact,
      message: form.message,
    });
    setPending(false);
    if (res.ok) setSent(true);
  }

  const waLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `مرحبًا ${name}، تواصلت معك عبر منصّة لام.`
      )}`
    : null;

  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <h3 className="text-lg font-semibold text-content">تواصل مع {name}</h3>
      <div className="mt-4 flex flex-col gap-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp")}
            className={buttonClasses("primary", "md")}
          >
            واتساب
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} onClick={() => track("call")} className={buttonClasses("outline", "md")}>
            اتصال
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            onClick={() => track("email")}
            className={buttonClasses("outline", "md")}
          >
            بريد إلكترونيّ
          </a>
        )}
        {formEnabled && !open && !sent && (
          <button onClick={() => setOpen(true)} className={buttonClasses("ghost", "md")}>
            أرسل رسالة عبر المنصّة
          </button>
        )}
      </div>

      {open && !sent && (
        <form onSubmit={handleForm} className="mt-4 space-y-3">
          <input
            required
            placeholder="اسمك"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="h-10 w-full rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
          />
          <input
            required
            placeholder="وسيلة تواصلك (جوال/بريد)"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className="h-10 w-full rounded-lg border border-line bg-base px-3 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
          />
          <textarea
            required
            placeholder="رسالتك"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="w-full rounded-lg border border-line bg-base px-3 py-2 text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
          />
          <button type="submit" disabled={pending} className={buttonClasses("primary", "md", "w-full")}>
            {pending ? "جارٍ الإرسال…" : "إرسال"}
          </button>
        </form>
      )}

      {sent && (
        <p className="mt-4 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
          تمّ إرسال رسالتك. سيتواصل معك المهنيّ مباشرةً.
        </p>
      )}

      <p className="mt-4 text-xs text-muted">
        لام تُسهّل التواصل ولا تقدّم الخدمة المهنيّة بنفسها.
      </p>
    </div>
  );
}
