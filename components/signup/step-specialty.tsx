"use client";

import * as React from "react";
import { RadioCard } from "@/components/ui/radio-card";
import type { SignupFormData } from "@/lib/signup/types";

export interface StepSpecialtyProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

type Spec = { slug: string; name_ar: string; description: string | null };

// قائمة احتياطيّة إن تعذّر الجلب
const FALLBACK: Spec[] = [
  { slug: "commercial", name_ar: "تجاريّ", description: "الشركات، الإفلاس، المحاكم التجارية، التنفيذ، المنافسة." },
  { slug: "criminal", name_ar: "جنائيّ", description: "الإجراءات الجزائية، مكافحة المخدرات، مكافحة الإرهاب." },
  { slug: "real_estate", name_ar: "عقاريّ", description: "البيع والشراء، الإيجارات، السجل العقاري." },
  { slug: "labor", name_ar: "عمّاليّ", description: "العقود، الفصل، التأمينات، نزاعات العمّال." },
  { slug: "personal_status", name_ar: "أحوال شخصيّة", description: "الزواج، الطلاق، الحضانة، الميراث." },
  { slug: "administrative", name_ar: "إداريّ", description: "ديوان المظالم، القرارات الإدارية، العقود الحكومية." },
  { slug: "tax", name_ar: "ضريبيّ", description: "ضريبة القيمة المضافة، الزكاة، الضريبة الانتقائيّة." },
  { slug: "intellectual_property", name_ar: "ملكيّة فكريّة", description: "العلامات التجارية، براءات الاختراع، حقوق المؤلف." },
];

const StepSpecialty: React.FC<StepSpecialtyProps> = ({ data, onChange, errors }) => {
  const [specs, setSpecs] = React.useState<Spec[]>(FALLBACK);

  React.useEffect(() => {
    let active = true;
    fetch("/api/specialties")
      .then((r) => r.json())
      .then((j) => {
        if (active && j?.ok && Array.isArray(j.specialties) && j.specialties.length > 0) {
          setSpecs(j.specialties);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">ما مجالك؟</h2>
        <p className="text-sm text-text-secondary">اختر مجالك المهنيّ الرئيس. تُبنى مسوّداتك ومحتواك حوله.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {specs.map((s) => (
          <RadioCard
            key={s.slug}
            name="specialty"
            value={s.slug}
            checked={data.specialty_slug === s.slug}
            onChange={(v) => onChange({ specialty_slug: v })}
            label={s.name_ar}
            description={s.description ?? ""}
          />
        ))}
      </div>
      {errors?.specialty_slug && <p className="text-danger text-sm">{errors.specialty_slug}</p>}
    </div>
  );
};

export { StepSpecialty };
