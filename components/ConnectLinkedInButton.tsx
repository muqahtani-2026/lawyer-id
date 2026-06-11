"use client";

/**
 * زرّ "اربط LinkedIn" — يوضع في بطاقة Pro بصفحة المِلَفّ.
 * يظهر فقط للمحامي على طبقة Pro (مرِّر isPro من مكوّن الخادم).
 *
 * - غير مربوط:  زرّ "اربط حساب LinkedIn" → يوجّه إلى /api/linkedin/connect.
 * - مربوط:      "مربوط ✓" + تاريخ انتهاء التوكن (~60 يومًا) + "إعادة الربط".
 */

type Props = {
  isPro: boolean;
  connected: boolean;
  expiresAt?: string | null;
};

function fmtExpiry(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      calendar: "gregory",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function ConnectLinkedInButton({ isPro, connected, expiresAt }: Props) {
  if (!isPro) return null;

  const go = () => {
    window.location.href = "/api/linkedin/connect";
  };

  if (connected) {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm" style={{ color: "var(--text-secondary, #8892b0)" }}>
          LinkedIn مربوط{" "}
          <span style={{ color: "var(--success, #4ade80)" }}>✓</span>
          {expiresAt && (
            <span className="text-xs"> · صالح حتّى {fmtExpiry(expiresAt)}</span>
          )}
        </span>
        <button
          type="button"
          onClick={go}
          className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          style={{
            border: "1px solid var(--border, #1d3461)",
            color: "var(--text-secondary, #8892b0)",
            background: "var(--bg-elevated, #152a4a)",
          }}
        >
          إعادة الربط
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={go}
      className="rounded-md px-4 py-2 text-sm font-semibold transition-colors"
      style={{ background: "#0a66c2", color: "#fff" }}
    >
      اربط حساب LinkedIn
    </button>
  );
}
