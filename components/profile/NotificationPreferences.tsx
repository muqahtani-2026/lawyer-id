"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { updateNotificationPreferences } from "@/lib/actions/profile";
import type { NotificationPrefs } from "@/lib/queries/profile";

// ============================================================
// Helpers
// ============================================================

function formatHour(h: number): string {
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h < 12 ? "صباحًا" : "مساءً";
  return `${hour12}:00 ${period}`;
}

// ============================================================
// Component
// ============================================================

export function NotificationPreferences({
  prefs,
  defaultEmail,
}: {
  prefs: NotificationPrefs;
  defaultEmail: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [telegramEnabled, setTelegramEnabled] = useState(prefs.telegram_enabled);
  const [telegramChatId, setTelegramChatId] = useState(prefs.telegram_chat_id ?? "");
  const [emailEnabled, setEmailEnabled] = useState(prefs.email_enabled);
  const [emailAddress, setEmailAddress] = useState(prefs.email_address ?? defaultEmail ?? "");
  const [hour, setHour] = useState(prefs.preferred_send_hour);

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateNotificationPreferences({
        telegram_enabled: telegramEnabled,
        telegram_chat_id: telegramEnabled ? telegramChatId : null,
        email_enabled: emailEnabled,
        email_address: emailEnabled ? emailAddress : null,
        preferred_send_hour: hour,
      });
      if (result.success) {
        setSuccess("تمّ حفظ تفضيلاتك.");
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

      {/* Telegram */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#e6f1ff] mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#4a9eff">
                <path d="M21.5 4.5L2.5 12.5l5 1.5 2 6 4-4 5 4 3-15.5z" />
              </svg>
              Telegram
            </h3>
            <p className="text-xs text-[#8892b0]">
              استلام كلّ مسوّدة في رسالة Telegram فور توليدها.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTelegramEnabled(!telegramEnabled)}
            disabled={isPending}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
              telegramEnabled ? "bg-[#4a9eff]" : "bg-[#1d3461]"
            )}
            role="switch"
            aria-checked={telegramEnabled}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                telegramEnabled ? "translate-x-[-22px]" : "translate-x-[-2px]"
              )}
            />
          </button>
        </div>

        {telegramEnabled && (
          <div className="pt-3 border-t border-[#1d3461]">
            <label className="block text-xs text-[#8892b0] mb-1.5">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              disabled={isPending}
              placeholder="مثال: 5509623427"
              className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <p className="text-xs text-[#8892b0] mt-2 leading-relaxed">
              💡 افتح{" "}
              <code className="px-1.5 py-0.5 bg-[#152a4a] rounded text-[#4a9eff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                @LawyerIDSA_bot
              </code>{" "}
              على Telegram، أرسل{" "}
              <code className="px-1.5 py-0.5 bg-[#152a4a] rounded text-[#4a9eff]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                /start
              </code>
              ، وانسخ الرقم الذي يردّ به البوت.
            </p>
          </div>
        )}
      </section>

      {/* Email */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-[#e6f1ff] mb-1 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a9eff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              البريد الإلكترونيّ
            </h3>
            <p className="text-xs text-[#8892b0]">
              استلام ملخّص يوميّ بكلّ المسوّدات الجديدة.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailEnabled(!emailEnabled)}
            disabled={isPending}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
              emailEnabled ? "bg-[#4a9eff]" : "bg-[#1d3461]"
            )}
            role="switch"
            aria-checked={emailEnabled}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                emailEnabled ? "translate-x-[-22px]" : "translate-x-[-2px]"
              )}
            />
          </button>
        </div>

        {emailEnabled && (
          <div className="pt-3 border-t border-[#1d3461]">
            <label className="block text-xs text-[#8892b0] mb-1.5">
              عنوان البريد الإلكترونيّ
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              disabled={isPending}
              placeholder="you@example.com"
              dir="ltr"
              className="w-full px-3 py-2 bg-[#0a192f] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors text-left"
            />
            {defaultEmail && emailAddress !== defaultEmail && (
              <p className="text-xs text-[#8892b0] mt-2">
                💡 بريد حسابك: <span dir="ltr" className="text-[#4a9eff]">{defaultEmail}</span>
              </p>
            )}
          </div>
        )}
      </section>

      {/* Send Hour */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#e6f1ff] mb-1">
          ساعة الإرسال المُفضَّلة
        </h3>
        <p className="text-xs text-[#8892b0] mb-4">
          توقيت الرياض. ينطبق على ملخّص البريد اليوميّ.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="range"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(parseInt(e.target.value, 10))}
            disabled={isPending}
            className="flex-1 min-w-[200px] accent-[#4a9eff]"
          />
          <div className="bg-[#152a4a] border border-[#1d3461] rounded-md px-4 py-2 min-w-[120px] text-center">
            <div
              className="text-lg font-bold text-[#4a9eff] leading-tight"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {String(hour).padStart(2, "0")}:00
            </div>
            <div className="text-xs text-[#8892b0]">{formatHour(hour)}</div>
          </div>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-4 flex items-center justify-between gap-3 shadow-lg">
        <span className="text-xs text-[#8892b0]">
          {telegramEnabled || emailEnabled
            ? "ستستلم المسوّدات على القنوات المُفعَّلة."
            : "⚠️ لن تستلم المسوّدات إلّا في الواجهة."}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2 bg-[#4a9eff] hover:bg-[#3a8eef] disabled:bg-[#1d3461] disabled:text-[#8892b0] text-white text-sm font-medium rounded-md transition-colors"
        >
          {isPending ? "جاري الحفظ..." : "حفظ التفضيلات"}
        </button>
      </div>
    </div>
  );
}
