"use client";

/**
 * زرّ "اربط X" — يوضع في صفحة المِلَفّ.
 * يظهر فقط للمحامي على طبقة Pro (مرِّر isPro من مكوّن الخادم).
 *
 * - غير مربوط:  زرّ "اربط حساب X" → يوجّه إلى /api/x/connect.
 * - مربوط:      يعرض @username + زرّ "إعادة الربط".
 */

type Props = {
  isPro: boolean;
  connectedUsername?: string | null;
};

export default function ConnectXButton({ isPro, connectedUsername }: Props) {
  if (!isPro) return null;

  const go = () => {
    window.location.href = "/api/x/connect";
  };

  if (connectedUsername) {
    return (
      <div className="flex items-center gap-3">
        <span
          className="text-sm"
          style={{ color: "var(--text-secondary, #8892b0)" }}
        >
          X مربوط:{" "}
          <span style={{ color: "var(--text-primary, #e6f1ff)" }}>
            @{connectedUsername}
          </span>
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
      style={{
        background: "var(--accent-lawyer, #4a9eff)",
        color: "#0a192f",
      }}
    >
      اربط حساب X
    </button>
  );
}
