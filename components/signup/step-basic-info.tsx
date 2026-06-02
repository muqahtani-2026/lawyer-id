import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SignupFormData } from "@/lib/signup/types";

interface Props {
  data: SignupFormData;
  onChange: (updates: Partial<SignupFormData>) => void;
}

export function StepBasicInfo({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-1">المعلومات الأساسية</h2>
        <p className="text-sm text-muted">
          من أنت؟ بياناتك الأساسية للتواصل والتعريف. الحقول بعلامة <span className="text-lawyer">*</span> مطلوبة.
        </p>
      </div>

      <Input
        label="الاسم الكامل *"
        type="text"
        required
        value={data.fullName}
        onChange={(e) => onChange({ fullName: e.target.value })}
        placeholder="محمد بن عبدالله الزهراني"
      />

      <Input
        label="البريد الإلكتروني *"
        type="email"
        required
        value={data.email}
        onChange={(e) => onChange({ email: e.target.value })}
        placeholder="mohammed@example.com"
        hint="سنرسل لك رابط تأكيد عبر هذا البريد."
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="رقم الجوّال"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="+966555555555"
        />

        <Input
          label="رقم رخصة المحاماة"
          type="text"
          value={data.licenseNumber}
          onChange={(e) => onChange({ licenseNumber: e.target.value })}
          placeholder="RZ-12345"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="معرّفك على X"
          type="text"
          value={data.xHandle}
          onChange={(e) => onChange({ xHandle: e.target.value })}
          placeholder="mohammed_law"
          hint="بدون @"
        />

        <Input
          label="رابط المدوّنة"
          type="url"
          value={data.blogUrl}
          onChange={(e) => onChange({ blogUrl: e.target.value })}
          placeholder="https://mohammed-law.sa"
        />
      </div>

      <Textarea
        label="نبذة مختصرة عنك"
        value={data.bioShort}
        onChange={(e) => onChange({ bioShort: e.target.value })}
        placeholder="محامٍ متخصّص في القانون التجاري، خبرة 3 سنوات."
        rows={3}
        hint="سطر أو سطرين تعريفيّين."
      />
    </div>
  );
}