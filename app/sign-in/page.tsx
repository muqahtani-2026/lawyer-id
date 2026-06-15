"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "success" | "error";

function SignInContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const hint = searchParams.get("hint");
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status>(urlError ? "error" : "idle");
  const [errorMessage, setErrorMessage] = useState(urlError || "");
  const [autoSentOnce, setAutoSentOnce] = useState(false);

  const sendMagicLink = useCallback(async (rawEmail: string) => {
    const trimmed = rawEmail.trim().toLowerCase();
    if (!trimmed) {
      setStatus("error");
      setErrorMessage("الرجاء إدخال بريد إلكتروني صحيح.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        setStatus("error");
        const msg = error.message.toLowerCase();
        if (
          msg.includes("not found") ||
          msg.includes("signups not allowed") ||
          msg.includes("signup not allowed")
        ) {
          setErrorMessage("لا يوجد حساب بهذا البريد. يرجى التسجيل أوّلًا.");
        } else if (msg.includes("rate") || msg.includes("too many")) {
          setErrorMessage("تجاوزت الحدّ المسموح. أعد المحاولة بعد قليل.");
        } else {
          setErrorMessage(`حدث خطأ: ${error.message}`);
        }
        return;
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? `حدث خطأ غير متوقّع: ${err.message}`
          : "حدث خطأ غير متوقّع. أعد المحاولة."
      );
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMagicLink(email);
  };

  // Auto-send Magic Link when user arrives from /signup/success
  useEffect(() => {
    if (hint === "signed-up" && initialEmail && !autoSentOnce) {
      setAutoSentOnce(true);
      sendMagicLink(initialEmail);
    }
  }, [hint, initialEmail, autoSentOnce, sendMagicLink]);

  return (
    <div className="min-h-screen bg-[#0a192f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 border-2 border-[#4a9eff] rounded-md flex items-center justify-center font-mono text-lg font-bold text-[#4a9eff]">
            Li
          </div>
          <div className="text-right">
            <div className="text-[#e6f1ff] text-xl font-semibold">
              لام
            </div>
            <div className="text-[10px] text-[#8892b0] tracking-[1.5px] mt-1">
              SAUDI · LEGAL · COMMERCIAL
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-xl p-8 shadow-2xl">
          {status === "success" ? (
            <SuccessState
              email={email}
              onReset={() => {
                setStatus("idle");
                setEmail("");
                setErrorMessage("");
                setAutoSentOnce(false);
              }}
            />
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#e6f1ff] mb-2 text-right">
                تسجيل الدخول
              </h1>
              <p className="text-[#8892b0] text-sm mb-8 text-right leading-relaxed">
                {hint === "signed-up"
                  ? "تمّ إنشاء حسابك. سيُرسَل رابط الدخول إلى بريدك تلقائيًّا..."
                  : "أدخل بريدك الإلكتروني لإرسال رابط دخول آمن إلى صندوقك."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-[#e6f1ff] mb-2 text-right font-medium"
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    placeholder="name@example.com"
                    className="w-full bg-[#152a4a] border border-[#1d3461] rounded-lg px-4 py-3 text-[#e6f1ff] placeholder:text-[#8892b0]/40 focus:outline-none focus:border-[#4a9eff] focus:ring-1 focus:ring-[#4a9eff]/30 transition-all disabled:opacity-50"
                  />
                </div>

                {status === "error" && errorMessage && (
                  <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg px-4 py-3 text-sm text-[#ef4444] text-right">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className="w-full bg-[#4a9eff] hover:bg-[#3a8de8] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {status === "loading" ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    "إرسال رابط الدخول"
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#1d3461] text-center space-y-3">
                <p className="text-[#8892b0] text-sm">
                  ليس لديك حساب؟{" "}
                  <Link
                    href="/signup"
                    className="text-[#4a9eff] hover:underline font-medium"
                  >
                    سجّل الآن
                  </Link>
                </p>
                <Link
                  href="/"
                  className="block text-[#8892b0] text-xs hover:text-[#e6f1ff] transition-colors"
                >
                  ← العودة إلى الصفحة الرئيسية
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessState({
  email,
  onReset,
}: {
  email: string;
  onReset: () => void;
}) {
  return (
    <div className="text-center space-y-5">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-full">
        <svg
          className="w-8 h-8 text-[#4ade80]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[#e6f1ff]">تمّ إرسال الرابط</h1>

      <p className="text-[#8892b0] text-sm leading-relaxed">
        تحقّق من بريدك الإلكتروني
        <br />
        <span
          dir="ltr"
          className="inline-block text-[#e6f1ff] font-medium mt-1"
        >
          {email}
        </span>
        <br />
        <span className="mt-2 inline-block">
          واضغط على رابط تسجيل الدخول.
        </span>
      </p>

      <div className="bg-[#152a4a] border border-[#1d3461] rounded-lg px-4 py-3 text-xs text-[#8892b0] leading-relaxed">
        الرابط صالح لمدّة{" "}
        <span className="text-[#e6f1ff]">ساعة واحدة فقط</span> وقابل
        للاستخدام مرّة واحدة.
        <br />
        إن لم تجد الرسالة، تحقّق من مجلّد Spam.
      </div>

      <button
        onClick={onReset}
        className="text-[#4a9eff] text-sm hover:underline mt-2"
      >
        ← إرسال إلى بريد آخر
      </button>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
          <div className="text-[#8892b0] text-sm">جاري التحميل...</div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
