"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Step = "loading" | "ready" | "linked" | "expired" | "error";

interface GenerateResponse {
  code: string;
  expiresAt: string;
  deepLink: string;
}

interface StatusResponse {
  linked: boolean;
  expired: boolean;
  found: boolean;
}

const POLL_MS = 3000;

export default function TelegramOnboardingPage() {
  const [step, setStep] = useState<Step>("loading");
  const [code, setCode] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const generateCode = useCallback(async () => {
    stopPolling();
    setStep("loading");
    setErrorMsg("");
    setCode(null);
    setDeepLink(null);
    setCopied(false);
    try {
      const res = await fetch("/api/onboarding/telegram/generate-code", {
        method: "POST",
      });
      if (res.status === 401) {
        setStep("error");
        setErrorMsg("يجب تسجيل الدخول أولًا قبل ربط Telegram.");
        return;
      }
      if (!res.ok) {
        setStep("error");
        setErrorMsg("تعذّر إنشاء كود الربط. حاول مرة أخرى.");
        return;
      }
      const data: GenerateResponse = await res.json();
      setCode(data.code);
      setDeepLink(data.deepLink);
      setStep("ready");
    } catch {
      setStep("error");
      setErrorMsg("حدث خطأ في الاتصال. تحقّق من الإنترنت وحاول مجددًا.");
    }
  }, [stopPolling]);

  // Generate a code on first load.
  useEffect(() => {
    generateCode();
    return () => stopPolling();
  }, [generateCode, stopPolling]);

  // Poll for link status while a code is active.
  useEffect(() => {
    if (step !== "ready" || !code) return;

    const check = async () => {
      try {
        const res = await fetch(
          `/api/onboarding/telegram/check-status?code=${encodeURIComponent(code)}`
        );
        if (!res.ok) return; // transient error -> keep polling
        const data: StatusResponse = await res.json();
        if (data.linked) {
          stopPolling();
          setStep("linked");
        } else if (data.expired || !data.found) {
          stopPolling();
          setStep("expired");
        }
      } catch {
        // ignore transient errors; keep polling
      }
    };

    pollRef.current = setInterval(check, POLL_MS);
    return () => stopPolling();
  }, [step, code, stopPolling]);

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard not available; ignore
    }
  };

  return (
    <main
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-[#0a192f] px-4 py-10"
      style={{ fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif" }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#1d3461] bg-[#0f1f3d] p-8 shadow-xl">
        {/* Brand mark */}
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#4a9eff] text-[#4a9eff]"
            style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
          >
            Li
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-[#e6f1ff]">لام</div>
            <div className="text-[10px] tracking-wider text-[#8892b0]">
              SAUDI · LEGAL · COMMERCIAL
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-xl font-bold text-[#e6f1ff]">
          ربط حساب Telegram
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-[#8892b0]">
          لاستلام مسوّداتك على Telegram، اربط حسابك في خطوتين بسيطتين.
        </p>

        {/* Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-[#1d3461] border-t-[#4a9eff]"
              aria-label="جارٍ التحميل"
            />
            <p className="text-sm text-[#8892b0]">جارٍ إنشاء كود الربط…</p>
          </div>
        )}

        {/* Ready */}
        {step === "ready" && code && deepLink && (
          <div className="flex flex-col gap-5">
            <div className="rounded-xl border border-[#1d3461] bg-[#152a4a] p-4 text-center">
              <div className="mb-1 text-xs text-[#8892b0]">كود الربط</div>
              <button
                onClick={copyCode}
                className="text-2xl font-bold tracking-widest text-[#4a9eff] transition hover:opacity-80"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                }}
                title="انسخ الكود"
              >
                {code}
              </button>
              <div className="mt-1 h-4 text-[11px] text-[#4ade80]">
                {copied ? "تم النسخ ✓" : ""}
              </div>
            </div>

            <a
              href={deepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#4a9eff] px-4 py-3 text-center font-semibold text-[#0a192f] transition hover:brightness-110"
            >
              افتح Telegram واربط حسابك
            </a>

            <div className="flex items-center justify-center gap-2 text-sm text-[#8892b0]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#fbbf24]" />
              في انتظار التأكيد من Telegram…
            </div>

            <button
              onClick={generateCode}
              className="text-xs text-[#8892b0] underline-offset-4 transition hover:text-[#e6f1ff] hover:underline"
            >
              لم يعمل؟ أنشئ كودًا جديدًا
            </button>
          </div>
        )}

        {/* Linked */}
        {step === "linked" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4ade80]/15 text-3xl text-[#4ade80]">
              ✓
            </div>
            <h2 className="text-lg font-bold text-[#e6f1ff]">
              تمّ ربط حسابك بنجاح!
            </h2>
            <p className="text-sm text-[#8892b0]">
              ستصلك مسوّداتك القانونية على Telegram. يمكنك إغلاق هذه الصفحة الآن.
            </p>
          </div>
        )}

        {/* Expired */}
        {step === "expired" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fbbf24]/15 text-3xl text-[#fbbf24]">
              ⏱
            </div>
            <h2 className="text-lg font-bold text-[#e6f1ff]">
              انتهت صلاحية الكود
            </h2>
            <p className="text-sm text-[#8892b0]">
              لم يكتمل الربط في الوقت المحدّد. أنشئ كودًا جديدًا وحاول مرة أخرى.
            </p>
            <button
              onClick={generateCode}
              className="rounded-xl bg-[#4a9eff] px-5 py-2.5 font-semibold text-[#0a192f] transition hover:brightness-110"
            >
              كود جديد
            </button>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ef4444]/15 text-3xl text-[#ef4444]">
              !
            </div>
            <h2 className="text-lg font-bold text-[#e6f1ff]">حدث خطأ</h2>
            <p className="text-sm text-[#8892b0]">{errorMsg}</p>
            <button
              onClick={generateCode}
              className="rounded-xl bg-[#4a9eff] px-5 py-2.5 font-semibold text-[#0a192f] transition hover:brightness-110"
            >
              حاول مجددًا
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
