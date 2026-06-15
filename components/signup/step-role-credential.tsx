"use client";

import * as React from "react";
import { RadioCard } from "@/components/ui/radio-card";
import type { SignupFormData } from "@/lib/signup/types";

export interface StepRoleCredentialProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

const KINDS = [
  { value: "lawyer", label: "محامٍ", description: "محامٍ مرخّص. يلزم إرفاق رخصة المحاماة." },
  { value: "trainee", label: "متدرّب", description: "متدرّب في المحاماة. يلزم إرفاق وثيقة التدريب." },
  { value: "legal_consultant", label: "مستشار / مختصّ قانونيّ", description: "يلزم إرفاق الوثيقة القانونيّة المثبتة." },
] as const;

const MAX_MB = 3;

const StepRoleCredential: React.FC<StepRoleCredentialProps> = ({ data, onChange, errors }) => {
  const [fileError, setFileError] = React.useState<string | null>(null);

  const docLabel =
    data.professional_kind === "lawyer"
      ? "رخصة المحاماة"
      : data.professional_kind === "trainee"
      ? "وثيقة التدريب"
      : data.professional_kind === "legal_consultant"
      ? "الوثيقة القانونيّة"
      : "الوثيقة";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const okTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(file.type)) {
      setFileError("الصيغة المسموحة: PDF أو صورة (JPG/PNG/WEBP).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setFileError(`الحجم الأقصى ${MAX_MB} ميجابايت.`);
      return;
    }
    const base64 = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1] ?? "");
      r.onerror = () => rej(new Error("read"));
      r.readAsDataURL(file);
    });
    onChange({
      credential_file_base64: base64,
      credential_file_name: file.name,
      credential_file_type: file.type,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">التحقّق المهنيّ</h2>
        <p className="text-sm text-text-secondary">
          نوع التسجيل والوثيقة المثبتة. <span className="text-accent-lawyer">تُراجَع كلّ الطلبات وتُعتمد قبل ظهور الملف للعامّة.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {KINDS.map((k) => (
          <RadioCard
            key={k.value}
            name="professional_kind"
            value={k.value}
            checked={data.professional_kind === k.value}
            onChange={(v) => onChange({ professional_kind: v as SignupFormData["professional_kind"] })}
            label={k.label}
            description={k.description}
          />
        ))}
      </div>
      {errors?.professional_kind && <p className="text-danger text-sm">{errors.professional_kind}</p>}

      {data.professional_kind && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-elevated/40 p-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-primary">رقم الرخصة / الوثيقة (اختياريّ)</span>
            <input
              value={data.credential_number}
              onChange={(e) => onChange({ credential_number: e.target.value })}
              className="h-10 rounded-lg border border-border bg-bg-primary px-3 text-text-primary focus:border-accent-lawyer focus:outline-none"
              placeholder="مثال: RZ-12345"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-text-primary">إرفاق {docLabel} (PDF أو صورة، حتّى {MAX_MB}MB)</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={onFile}
              className="text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-accent-lawyer file:px-4 file:py-2 file:text-bg-primary"
            />
          </label>

          {data.credential_file_name && (
            <p className="text-xs text-success">✓ مُرفَق: {data.credential_file_name}</p>
          )}
          {fileError && <p className="text-danger text-sm">{fileError}</p>}
          {errors?.credential_file_base64 && <p className="text-danger text-sm">{errors.credential_file_base64}</p>}
        </div>
      )}
    </div>
  );
};

export { StepRoleCredential };
