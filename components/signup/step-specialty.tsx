"use client";

import * as React from "react";
import { RadioCard } from "@/components/ui/radio-card";
import type { SignupFormData } from "@/lib/signup/types";

export interface StepSpecialtyProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

const SPECIALTIES = [
  { slug: "commercial",            label: "تجاريّ",            description: "الشركات، الإفلاس، المحاكم التجارية، التنفيذ، المنافسة.", active: true },
  { slug: "criminal",              label: "جنائيّ",            description: "الإجراءات الجزائية، مكافحة المخدرات، مكافحة الإرهاب.",   active: false },
  { slug: "real_estate",           label: "عقاريّ",            description: "البيع والشراء، الإيجارات، السجل العقاري.",                active: false },
  { slug: "labor",                 label: "عمّاليّ",            description: "العقود، الفصل، التأمينات، نزاعات العمّال.",                active: false },
  { slug: "personal_status",       label: "أحوال شخصيّة",      description: "الزواج، الطلاق، الحضانة، الميراث.",                       active: false },
  { slug: "administrative",        label: "إداريّ",            description: "ديوان المظالم، القرارات الإدارية، العقود الحكومية.",       active: false },
  { slug: "tax",                   label: "ضريبيّ",            description: "ضريبة القيمة المضافة، الزكاة، الضريبة الانتقائيّة.",        active: false },
  { slug: "intellectual_property", label: "ملكيّة فكريّة",      description: "العلامات التجارية، براءات الاختراع، حقوق المؤلف.",          active: false },
];

const StepSpecialty: React.FC<StepSpecialtyProps> = ({ data, onChange }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          ما تخصّصك؟
        </h2>
        <p className="text-sm text-text-secondary">
          في النسخة الحاليّة من المنصّة، التخصّص <span className="text-accent-lawyer">التجاريّ</span> فقط مُتاح. بقيّة التخصّصات قادمة قريبًا.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SPECIALTIES.map((s) => (
          <RadioCard
            key={s.slug}
            name="specialty"
            value={s.slug}
            checked={data.specialty_slug === s.slug}
            onChange={(v) => onChange({ specialty_slug: v })}
            label={s.label}
            description={s.description}
            disabled={!s.active}
            badge={!s.active ? "قريبًا" : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export { StepSpecialty };