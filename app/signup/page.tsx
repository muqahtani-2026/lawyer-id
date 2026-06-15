"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StepBasicInfo } from "@/components/signup/step-basic-info";
import { StepRoleCredential } from "@/components/signup/step-role-credential";
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
  "التحقّق المهنيّ",
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

  if (!data.full_name || !data.full_name.trim()) {
    errors.full_name = "الاسم الكامل مطلوب.";
  } else if (data.full_name.trim().length < 3) {
    errors.full_name = "الاسم قصير جدًّا.";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "البريد الإلكترونيّ مطلوب.";
  } else if (!emailRegex.test(data.email.trim())) {
    errors.email = "صيغة البريد غير صحيحة.";
  }

  if (data.blog_url && data.blog_url.trim() && !data.blog_url.startsWith("http")) {
    errors.blog_url = "الرابط يجب أن يبدأ بـ http أو https.";
  }

  return errors;
}

function validateRoleCredential(data: SignupFormData): StepErrors {
  const errors: StepErrors = {};
  if (!data.professional_kind) {
    errors.professional_kind = "اختر نوع التسجيل.";
  } else if (!data.credential_file_base64) {
    errors.credential_file_base64 = "إرفاق الوثيقة مطلوب للمراجعة والاعتماد.";
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

  if (!data.target_audience || !data.target_audience.trim()) {
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
  const samples = data.sample_writings || [];
  const completed = samples.filter(
    (s) => s && s.platform && s.topic && s.topic.trim() && s.text && s.text.trim()
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

const VALIDATORS: Record<number, (d: SignupFormData) => StepErrors> = {
  1: validateStep1,
  2: validateRoleCredential,
  3: validateStep2,
  4: validateStep3,
  5: validateStep4,
  6: validateStep5,
};

export default function SignupPage() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] =
    React.useState<SignupFormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = React.useState<StepErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const router = useRouter();

  const updateForm = (patch: Partial<SignupFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const handleNext = () => {
    let stepErrors: StepErrors = {};

    try {
      const validator = VALIDATORS[currentStep];
      if (validator) {
        stepErrors = validator(formData);
      }
    } catch (e) {
      console.error("Validation exception:", e);
      stepErrors = {};
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setErrors({});
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    let stepErrors: StepErrors = {};
    try {
      const validator = VALIDATORS[currentStep];
      if (validator) stepErrors = validator(formData);
    } catch (e) {
      console.error("Validation exception:", e);
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      professional_kind: formData.professional_kind,
      specialty_slug: formData.specialty_slug,
      credential_number: formData.credential_number,
      credential_file_base64: formData.credential_file_base64,
      credential_file_name: formData.credential_file_name,
      credential_file_type: formData.credential_file_type,
      target_audience: formData.target_audience,
      writing_style: formData.tone,
      preferred_length: formData.preferred_length,
      favorite_phrases: formData.favorite_phrases || [],
      avoided_phrases: formData.avoided_phrases || [],
      style_notes: formData.style_notes || "",
      writing_samples: (formData.sample_writings || []).map((s) => ({
        platform: s.platform,
        topic: s.topic,
        text: s.text,
      })),
      telegram_enabled: formData.telegram_enabled,
      email_enabled: formData.email_enabled,
      preferred_send_hour: formData.preferred_send_hour,
    };

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setSubmitError(result.error || "حدث خطأ أثناء التسجيل");
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      router.push(`/signup/success?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError("تعذّر الاتصال بالخادم. حاول مرّة أخرى.");
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo data={formData} onChange={updateForm} errors={errors} />;
      case 2:
        return <StepRoleCredential data={formData} onChange={updateForm} errors={errors} />;
      case 3:
        return <StepSpecialty data={formData} onChange={updateForm} errors={errors} />;
      case 4:
        return <StepWritingStyle data={formData} onChange={updateForm} errors={errors} />;
      case 5:
        return <StepWritingSamples data={formData} onChange={updateForm} errors={errors} />;
      case 6:
        return <StepNotifications data={formData} onChange={updateForm} errors={errors} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-border bg-bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark variant="lawyer" size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-semibold text-text-primary">
                لام
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

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary">
              إنشاء حسابك
            </h1>
            <p className="text-text-secondary">
              6 خطوات قصيرة. يُراجَع طلبك ويُعتمد قبل ظهور ملفك للعامّة.
            </p>
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6">
            <ProgressBar
              current={currentStep}
              total={TOTAL_STEPS}
              steps={STEP_LABELS}
            />
          </div>

          <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8">
            {renderStep()}
          </div>

          {submitError && (
          <div className="bg-danger/10 border border-danger/40 text-danger text-sm rounded-lg p-3 text-center">
            {submitError}
          </div>
        )}

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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "bg-accent-lawyer text-bg-primary",
                "hover:opacity-90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال"}
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
        </div>
      </main>
    </div>
  );
}