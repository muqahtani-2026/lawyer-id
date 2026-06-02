"use client";

import * as React from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StepBasicInfo } from "@/components/signup/step-basic-info";
import { StepSpecialty } from "@/components/signup/step-specialty";
import { StepWritingStyle } from "@/components/signup/step-writing-style";
import { StepWritingSamples } from "@/components/signup/step-writing-samples";
import { StepNotifications } from "@/components/signup/step-notifications";
import {
  INITIAL_FORM_DATA,
  type SignupFormData,
} from "@/lib/signup/types";
import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "الأساسيّات",
  "التخصّص",
  "أسلوب الكتابة",
  "العيّنات",
  "التفضيلات",
];

const TOTAL_STEPS = STEP_LABELS.length;

type StepErrors = Partial<Record<keyof SignupFormData, string>>;

function validateStep1(data: SignupFormData): StepErrors {
  const errors: StepErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!data.full_name.trim()) {
    errors.full_name = "الاسم الكامل مطلوب.";
  } else if (data.full_name.trim().length < 3) {
    errors.full_name = "الاسم قصير جدًّا.";
  }

  if (!data.email.trim()) {
    errors.email = "البريد الإلكترونيّ مطلوب.";
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = "صيغة البريد غير صحيحة.";
  }

  if (data.blog_url.trim() && !data.blog_url.startsWith("http")) {
    errors.blog_url = "الرابط يجب أن يبدأ بـ http أو https.";
  }

  return errors;
}

function validateStep2(data: SignupFormData): StepErrors {
  const errors: StepErrors = {};
  if (!data.specialty_slug) {
    errors.specialty_slug = "اختر تخصّصًا.";
  }
  return errors;
}

function validateStep3(data: SignupFormData): StepErrors {
  const errors: StepErrors = {};

  if (!data.target_audience.trim()) {
    errors.target_audience = "حدّد جمهورك المستهدف.";
  }

  if (!data.tone) {
    errors.tone = "اختر نبرة الكتابة.";
  }

  if (!data.preferred_length) {
    errors.preferred_length = "اختر الطول المُفضَّل.";
  }

  return errors;
}

function validateStep4(data: SignupFormData): StepErrors {
  const errors: StepErrors = {};
  const completed = data.sample_writings.filter(
    (s) => s.platform && s.topic.trim() && s.text.trim()
  );

  if (completed.length < 3) {
    errors.sample_writings = `أضف 3 عيّنات كاملة على الأقلّ. حاليًّا: ${completed.length}.`;
  }

  return errors;
}

function validateStep5(data: SignupFormData): StepErrors {
  const errors: StepErrors = {};

  if (!data.telegram_enabled && !data.email_enabled) {
    errors.telegram_enabled = "اختر قناة واحدة على الأقلّ (Telegram أو Email).";
  }

  if (data.preferred_send_hour < 0 || data.preferred_send_hour > 23) {
    errors.preferred_send_hour = "الساعة بين 0 و 23.";
  }

  return errors;
}

const VALIDATORS = {
  1: validateStep1,
  2: validateStep2,
  3: validateStep3,
  4: validateStep4,
  5: validateStep5,
} as const;

export default function SignupPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] =
    React.useState<SignupFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = React.useState<StepErrors>({});

  const updateForm = (patch: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    const validator = VALIDATORS[currentStep as keyof typeof VALIDATORS];
    const stepErrors = validator(formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo data={formData} onChange={updateForm} errors={errors} />;
      case 2:
        return <StepSpecialty data={formData} onChange={updateForm} errors={errors} />;
      case 3:
        return <StepWritingStyle data={formData} onChange={updateForm} errors={errors} />;
      case 4:
        return <StepWritingSamples data={formData} onChange={updateForm} errors={errors} />;
      case 5:
        return <StepNotifications data={formData} onChange={updateForm} errors={errors} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark variant="lawyer" size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-semibold text-text-primary">
                Lawyer ID
              </span>
              <span className="text-[10px] font-mono text-text-secondary tracking-wider">
                SAUDI · LEGAL · COMMERCIAL
              </span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← العودة للرئيسيّة
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-8">
          {/* Title */}
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
              إنشاء حسابك
            </h1>
            <p className="text-text-secondary">
              5 خطوات قصيرة، وستبدأ باستلام مسوّداتك بأسلوبك.
            </p>
          </div>

          {/* Progress */}
          <div className="bg-bg-card border border-border rounded-xl p-6">
            <ProgressBar
              current={currentStep}
              total={TOTAL_STEPS}
              steps={STEP_LABELS}
            />
          </div>

          {/* Step Content */}
          <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "border border-border bg-bg-card text-text-primary",
                "hover:bg-bg-elevated",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bg-card"
              )}
            >
              ← السابق
            </button>

            {isLastStep ? (
              <button
                type="button"
                disabled
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-medium",
                  "bg-bg-elevated text-text-secondary",
                  "cursor-not-allowed border border-border"
                )}
                title="سيُفعَّل في Phase 4.2ب-2"
              >
                إرسال (قادم في 4.2ب-2)
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "bg-accent-lawyer text-bg-primary",
                  "hover:opacity-90"
                )}
              >
                التالي ←
              </button>
            )}
          </div>

          <p className="text-center text-xs font-mono text-text-secondary opacity-60">
            DEV: state preserved in memory only. Refresh = reset.
          </p>
        </div>
      </main>
    </div>
  );
}