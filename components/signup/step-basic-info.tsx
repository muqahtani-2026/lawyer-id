"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SignupFormData, StepErrors } from "@/lib/signup/types";

interface StepBasicInfoProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors: StepErrors;
}

export function StepBasicInfo({ data, onChange, errors }: StepBasicInfoProps) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          المعلومات الأساسية
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          من أنت؟ بياناتك الأساسية للتواصل والتعريف. الحقول بعلامة * مطلوبة.
        </p>
      </header>

      <Input
        label="الاسم الكامل"
        required
        id="full_name"
        type="text"
        placeholder="محمد بن عبدالله الزهراني"
        value={data.full_name ?? ""}
        onChange={(e) => onChange({ full_name: e.target.value })}
        error={errors.full_name}
      />

      <Input
        label="البريد الإلكتروني"
        required
        id="email"
        type="email"
        placeholder="mohammed@example.com"
        value={data.email ?? ""}
        onChange={(e) => onChange({ email: e.target.value })}
        error={errors.email}
        hint="سنرسل لك رابط تأكيد عبر هذا البريد."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="رقم الجوّال"
          id="phone"
          type="tel"
          placeholder="+966555555555"
          value={data.phone ?? ""}
          onChange={(e) => onChange({ phone: e.target.value })}
        />

        <Input
          label="رقم رخصة المحاماة"
          id="license_number"
          type="text"
          placeholder="RZ-12345"
          value={data.license_number ?? ""}
          onChange={(e) => onChange({ license_number: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="معرّفك على X"
          id="x_handle"
          type="text"
          placeholder="mohammed_law"
          value={data.x_handle ?? ""}
          onChange={(e) => onChange({ x_handle: e.target.value })}
          hint="بدون @"
        />

        <Input
          label="رابط المدوّنة"
          id="blog_url"
          type="url"
          placeholder="https://mohammed-law.sa"
          value={data.blog_url ?? ""}
          onChange={(e) => onChange({ blog_url: e.target.value })}
          error={errors.blog_url}
        />
      </div>

      <Textarea
        label="نبذة مختصرة عنك"
        id="bio_short"
        rows={3}
        placeholder="محامٍ متخصّص في القانون التجاري، خبرة 3 سنوات."
        value={data.bio_short ?? ""}
        onChange={(e) => onChange({ bio_short: e.target.value })}
        hint="سطر أو سطرين تعريفيّين."
      />
    </div>
  );
}