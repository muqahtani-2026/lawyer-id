"use client";

import { useState } from "react";

export function ShareButton({ title, className }: { title?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const data = { title: title ?? "لام", text: title ?? "", url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      /* المستخدم ألغى المشاركة */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* تجاهل */
    }
  }

  return (
    <button
      onClick={share}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-content transition-colors hover:border-lawyer"
      }
      aria-label="مشاركة"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
      </svg>
      {copied ? "نُسخ الرابط ✓" : "مشاركة"}
    </button>
  );
}
