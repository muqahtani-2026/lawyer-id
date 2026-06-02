"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StepBasicInfo } from "@/components/signup/step-basic-info";
import { SignupFormData, INITIAL_FORM_DATA } from "@/lib/signup/types";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["أساسي", "تخصص", "أسلوب", "عيّنات", "توزيع"];
const TOTAL_STEPS = 5;

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SignupFormData>(INITIAL_FORM_DATA);

  const updateData = (updates: Partial<SignupFormData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark variant="lawyer" size="sm" />
            <span className="font-bold text-lg">Lawyer ID</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-content transition">
            عودة للرئيسية
          </Link>
        </div>
      </header>

      {/* Wizard */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <ProgressBar
            current={step}
            total={TOTAL_STEPS}
            steps={STEP_LABELS}
          />

          <div className="mt-8 bg-card border border-line rounded-2xl p-8">
            {step === 1 && <StepBasicInfo data={data} onChange={updateData} />}
            {step === 2 && <StepPlaceholder title="التخصص" stepNum={2} />}
            {step === 3 && <StepPlaceholder title="أسلوب الكتابة" stepNum={3} />}
            {step === 4 && <StepPlaceholder title="عيّنات الكتابة" stepNum={4} />}
            {step === 5 && <StepPlaceholder title="التوزيع" stepNum={5} />}

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-line flex items-center justify-between">
              <button
                onClick={goBack}
                disabled={step === 1}
                className={cn(
                  "px-6 py-2.5 rounded-lg border border-line text-content text-sm font-medium",
                  "hover:bg-elevated transition",
                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                )}
              >
                السابق
              </button>

              {step < TOTAL_STEPS ? (
                <button
                  onClick={goNext}
                  className="px-6 py-2.5 rounded-lg bg-lawyer text-sm font-semibold hover:opacity-90 transition"
                  style={{ color: "#0a192f" }}
                >
                  التالي ←
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-2.5 rounded-lg bg-lawyer text-sm font-semibold opacity-40 cursor-not-allowed"
                  style={{ color: "#0a192f" }}
                >
                  إرسال (قادم في 4.3)
                </button>
              )}
            </div>
          </div>

          {/* Dev hint */}
          <p className="mt-4 text-center text-xs text-muted font-mono">
            DEV: state preserved in memory only. Refresh = reset.
          </p>
        </div>
      </div>
    </main>
  );
}

function StepPlaceholder({ title, stepNum }: { title: string; stepNum: number }) {
  return (
    <div className="text-center py-12 space-y-3">
      <div className="text-5xl">🚧</div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted">
        الخطوة {stepNum} من {TOTAL_STEPS} — ستُكتمل في الدفعة 4.2ب.
      </p>
    </div>
  );
}