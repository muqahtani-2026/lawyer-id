# ============================================================
# Phase 4.2ب-1 — Steps 2-5 UI (functional, no submit yet)
# 9 files (7 new + 2 rewritten)
# ============================================================

Set-Location 'C:\Dev\lawyer-id'

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $full = Join-Path (Get-Location) $Path
    [System.IO.File]::WriteAllText($full, $Content, $utf8NoBom)
    Write-Host "  + $Path" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Phase 4.2ب-1 — writing 9 files" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""

# ------------------------------------------------------------
# 1) components/ui/radio-card.tsx (NEW)
# ------------------------------------------------------------
$content1 = @'
import * as React from "react";
import { cn } from "@/lib/utils";

export interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  badge?: string;
  className?: string;
}

const RadioCard: React.FC<RadioCardProps> = ({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled,
  badge,
  className,
}) => {
  const id = `${name}-${value}`;

  return (
    <label
      htmlFor={id}
      className={cn(
        "relative flex flex-col gap-1.5 p-4 rounded-lg cursor-pointer",
        "border transition-all duration-150",
        "bg-bg-elevated",
        checked && !disabled && "border-accent-lawyer ring-1 ring-accent-lawyer",
        !checked && !disabled && "border-border hover:border-accent-lawyer/50",
        disabled && "opacity-40 cursor-not-allowed border-border",
        className
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)}
        disabled={disabled}
        className="sr-only"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-text-primary">{label}</span>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-bg-card border border-border text-text-secondary">
            {badge}
          </span>
        )}
        {checked && !badge && (
          <span className="w-4 h-4 rounded-full bg-accent-lawyer flex items-center justify-center text-bg-primary text-[10px] font-bold">
            ✓
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </label>
  );
};

export { RadioCard };
'@
Write-FileUtf8NoBom 'components\ui\radio-card.tsx' $content1

# ------------------------------------------------------------
# 2) components/ui/phrase-list.tsx (NEW)
# ------------------------------------------------------------
$content2 = @'
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface PhraseListProps {
  label?: string;
  phrases: string[];
  onChange: (phrases: string[]) => void;
  placeholder?: string;
  hint?: string;
  maxItems?: number;
  required?: boolean;
}

const PhraseList: React.FC<PhraseListProps> = ({
  label,
  phrases,
  onChange,
  placeholder = "اكتب عبارة ثم اضغط Enter",
  hint,
  maxItems = 10,
  required,
}) => {
  const [draft, setDraft] = React.useState("");
  const inputId = React.useId();

  const handleAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (phrases.includes(trimmed)) {
      setDraft("");
      return;
    }
    if (phrases.length >= maxItems) return;
    onChange([...phrases, trimmed]);
    setDraft("");
  };

  const handleRemove = (idx: number) => {
    onChange(phrases.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-danger mr-1">*</span>}
        </label>
      )}

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          dir="auto"
          disabled={phrases.length >= maxItems}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-lg",
            "bg-bg-elevated text-text-primary",
            "border border-border",
            "placeholder:text-text-secondary",
            "focus:outline-none focus:ring-2 focus:ring-accent-lawyer focus:border-transparent",
            "transition-colors duration-150",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim() || phrases.length >= maxItems}
          className={cn(
            "px-4 py-2.5 rounded-lg text-sm font-medium",
            "bg-accent-lawyer text-bg-primary",
            "hover:opacity-90 transition-opacity",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          إضافة
        </button>
      </div>

      {phrases.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {phrases.map((phrase, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-elevated border border-border text-sm text-text-primary"
              dir="auto"
            >
              {phrase}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-text-secondary hover:text-danger transition-colors text-base leading-none"
                aria-label={`حذف ${phrase}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {hint && (
        <p className="text-xs text-text-secondary">
          {hint}
          <span className="font-mono"> ({phrases.length}/{maxItems})</span>
        </p>
      )}
    </div>
  );
};

export { PhraseList };
'@
Write-FileUtf8NoBom 'components\ui\phrase-list.tsx' $content2

# ------------------------------------------------------------
# 3) components/ui/sample-editor.tsx (NEW)
# ------------------------------------------------------------
$content3 = @'
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SampleWriting } from "@/lib/signup/types";

export interface SampleEditorProps {
  index: number;
  sample: SampleWriting;
  onChange: (sample: SampleWriting) => void;
  onRemove: () => void;
  canRemove: boolean;
}

const PLATFORMS: { value: SampleWriting["platform"]; label: string }[] = [
  { value: "x", label: "X (تويتر)" },
  { value: "blog", label: "مدوّنة" },
  { value: "linkedin", label: "LinkedIn" },
];

const SampleEditor: React.FC<SampleEditorProps> = ({
  index,
  sample,
  onChange,
  onRemove,
  canRemove,
}) => {
  return (
    <div className="p-5 rounded-xl border border-border bg-bg-elevated/50 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-semibold text-text-primary">
          العيّنة {index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-danger hover:opacity-80 transition-opacity"
          >
            حذف العيّنة
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">
          المنصّة <span className="text-danger mr-1">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange({ ...sample, platform: p.value })}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium",
                "border transition-all duration-150",
                sample.platform === p.value
                  ? "border-accent-lawyer bg-bg-card text-text-primary ring-1 ring-accent-lawyer"
                  : "border-border bg-bg-card text-text-secondary hover:border-accent-lawyer/50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="الموضوع"
        required
        placeholder="مثال: الإفلاس التجاري"
        value={sample.topic}
        onChange={(e) => onChange({ ...sample, topic: e.target.value })}
        hint="باختصار — كلمتان أو ثلاث."
      />

      <Textarea
        label="النصّ كاملًا"
        required
        rows={5}
        placeholder="انسخ هنا تغريدتك أو منشورك السابق كما هو."
        value={sample.text}
        onChange={(e) => onChange({ ...sample, text: e.target.value })}
      />
    </div>
  );
};

export { SampleEditor };
'@
Write-FileUtf8NoBom 'components\ui\sample-editor.tsx' $content3

# ------------------------------------------------------------
# 4) components/signup/step-specialty.tsx (NEW)
# ------------------------------------------------------------
$content4 = @'
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
'@
Write-FileUtf8NoBom 'components\signup\step-specialty.tsx' $content4

# ------------------------------------------------------------
# 5) components/signup/step-writing-style.tsx (NEW)
# ------------------------------------------------------------
$content5 = @'
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioCard } from "@/components/ui/radio-card";
import { PhraseList } from "@/components/ui/phrase-list";
import type { SignupFormData, Tone, PreferredLength } from "@/lib/signup/types";

export interface StepWritingStyleProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: "formal",      label: "رسميّة",   description: "صياغة قانونيّة مهنيّة، مناسبة للشركات الكبرى." },
  { value: "friendly",    label: "وديّة",     description: "قريبة من القارئ، بدون تكلّف، للجمهور العام." },
  { value: "educational", label: "تعليميّة", description: "تشرح بالأمثلة، مناسبة للمبتدئين والطلّاب." },
  { value: "analytical",  label: "تحليليّة", description: "تستخرج الدروس، مناسبة للزملاء المحامين." },
  { value: "concise",     label: "مختصرة",  description: "مباشرة، تقول الفكرة في أقلّ كلمات ممكنة." },
];

const LENGTHS: { value: PreferredLength; label: string; description: string }[] = [
  { value: "short_tweet",  label: "تغريدة قصيرة", description: "حتّى 50 كلمة." },
  { value: "medium_post",  label: "منشور متوسّط", description: "بين 100 و 250 كلمة." },
  { value: "long_article", label: "مقال طويل",   description: "بين 400 و 800 كلمة." },
];

const StepWritingStyle: React.FC<StepWritingStyleProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          أُسلوب الكِتابة
        </h2>
        <p className="text-sm text-text-secondary">
          هذه الإجابات ستُشكّل صوتك في كلّ مسوّدة. كلّما كانت أدقّ، كان المحتوى أقرب إليك.
        </p>
      </div>

      <Input
        label="من تكتب لهم عادةً؟"
        required
        placeholder="مثال: شركات ناشئة وروّاد أعمال"
        value={data.target_audience}
        onChange={(e) => onChange({ target_audience: e.target.value })}
        error={errors.target_audience}
        hint="جمهورك المستهدف بكلمة أو سطر."
      />

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-text-primary">
          النبرة <span className="text-danger mr-1">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TONES.map((t) => (
            <RadioCard
              key={t.value}
              name="tone"
              value={t.value}
              checked={data.tone === t.value}
              onChange={(v) => onChange({ tone: v as Tone })}
              label={t.label}
              description={t.description}
            />
          ))}
        </div>
        {errors.tone && (
          <p className="text-xs text-danger" role="alert">{errors.tone}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-text-primary">
          الطول المُفضَّل <span className="text-danger mr-1">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {LENGTHS.map((l) => (
            <RadioCard
              key={l.value}
              name="preferred_length"
              value={l.value}
              checked={data.preferred_length === l.value}
              onChange={(v) => onChange({ preferred_length: v as PreferredLength })}
              label={l.label}
              description={l.description}
            />
          ))}
        </div>
        {errors.preferred_length && (
          <p className="text-xs text-danger" role="alert">{errors.preferred_length}</p>
        )}
      </div>

      <PhraseList
        label="عبارات تستخدمها كثيرًا"
        phrases={data.favorite_phrases}
        onChange={(p) => onChange({ favorite_phrases: p })}
        placeholder="مثال: استنادًا إلى النظام"
        hint="اختياريّ — حتّى 10 عبارات."
        maxItems={10}
      />

      <PhraseList
        label="عبارات تتجنّبها"
        phrases={data.avoided_phrases}
        onChange={(p) => onChange({ avoided_phrases: p })}
        placeholder="مثال: بكلّ تأكيد"
        hint="اختياريّ — حتّى 10 عبارات."
        maxItems={10}
      />

      <Textarea
        label="ملاحظات أخرى عن أُسلوبك"
        rows={3}
        placeholder="مثال: أُفضّل البدء بسؤال يستفزّ التفكير، ثمّ الإجابة عليه."
        value={data.style_notes}
        onChange={(e) => onChange({ style_notes: e.target.value })}
        hint="اختياريّ — أيّ تفاصيل تساعدنا في مُحاكاة صوتك."
      />
    </div>
  );
};

export { StepWritingStyle };
'@
Write-FileUtf8NoBom 'components\signup\step-writing-style.tsx' $content5

# ------------------------------------------------------------
# 6) components/signup/step-writing-samples.tsx (NEW)
# ------------------------------------------------------------
$content6 = @'
"use client";

import * as React from "react";
import { SampleEditor } from "@/components/ui/sample-editor";
import { cn } from "@/lib/utils";
import type { SignupFormData, SampleWriting } from "@/lib/signup/types";

export interface StepWritingSamplesProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

const MAX_SAMPLES = 5;
const MIN_SAMPLES = 3;

const EMPTY_SAMPLE: SampleWriting = {
  platform: "x",
  topic: "",
  text: "",
};

const StepWritingSamples: React.FC<StepWritingSamplesProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  React.useEffect(() => {
    if (data.sample_writings.length === 0) {
      onChange({ sample_writings: [{ ...EMPTY_SAMPLE }] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const samples = data.sample_writings.length > 0 ? data.sample_writings : [EMPTY_SAMPLE];

  const updateSample = (idx: number, sample: SampleWriting) => {
    const next = [...samples];
    next[idx] = sample;
    onChange({ sample_writings: next });
  };

  const removeSample = (idx: number) => {
    onChange({ sample_writings: samples.filter((_, i) => i !== idx) });
  };

  const addSample = () => {
    if (samples.length >= MAX_SAMPLES) return;
    onChange({ sample_writings: [...samples, { ...EMPTY_SAMPLE }] });
  };

  const completedCount = samples.filter(
    (s) => s.topic.trim() && s.text.trim()
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          عيّنات من كِتاباتك
        </h2>
        <p className="text-sm text-text-secondary">
          هذا الجزء <span className="text-accent-lawyer">الأهمّ</span> — أرسل لنا {MIN_SAMPLES} عيّنات على الأقلّ من تغريداتك أو منشوراتك السابقة. كلّما كانت أصيلة وحديثة، كانت المسوّدات أقرب لصوتك.
        </p>
        <div className="text-xs font-mono text-text-secondary mt-1">
          المكتمل: <span className="text-accent-lawyer">{completedCount}</span> / {MIN_SAMPLES} (الحدّ الأدنى) — حتّى {MAX_SAMPLES} (الحدّ الأقصى).
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {samples.map((sample, idx) => (
          <SampleEditor
            key={idx}
            index={idx}
            sample={sample}
            onChange={(s) => updateSample(idx, s)}
            onRemove={() => removeSample(idx)}
            canRemove={samples.length > 1}
          />
        ))}
      </div>

      {samples.length < MAX_SAMPLES && (
        <button
          type="button"
          onClick={addSample}
          className={cn(
            "px-4 py-3 rounded-lg text-sm font-medium",
            "border-2 border-dashed border-border text-text-secondary",
            "hover:border-accent-lawyer hover:text-accent-lawyer transition-colors",
            "bg-transparent"
          )}
        >
          + إضافة عيّنة أُخرى
        </button>
      )}

      {errors.sample_writings && (
        <p className="text-sm text-danger" role="alert">
          {errors.sample_writings}
        </p>
      )}
    </div>
  );
};

export { StepWritingSamples };
'@
Write-FileUtf8NoBom 'components\signup\step-writing-samples.tsx' $content6

# ------------------------------------------------------------
# 7) components/signup/step-notifications.tsx (NEW)
# ------------------------------------------------------------
$content7 = @'
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { SignupFormData } from "@/lib/signup/types";

export interface StepNotificationsProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, enabled, onChange }) => {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-bg-elevated">
      <div className="flex flex-col gap-1 flex-1">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary leading-relaxed">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
          enabled ? "bg-accent-lawyer" : "bg-bg-card border border-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-text-primary transition-all duration-200",
            enabled ? "right-[22px]" : "right-0.5"
          )}
        />
      </button>
    </div>
  );
};

const StepNotifications: React.FC<StepNotificationsProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          تفضيلات التوزيع
        </h2>
        <p className="text-sm text-text-secondary">
          أين تريد أن تصلك المسوّدات؟ يُمكنك اختيار قناة واحدة أو الاثنتَين.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <ToggleRow
          label="عبر Telegram"
          description="يصلك إشعار فوريّ بكلّ مسوّدة جديدة على Telegram."
          enabled={data.telegram_enabled}
          onChange={(v) => onChange({ telegram_enabled: v })}
        />

        <ToggleRow
          label="عبر البريد الإلكترونيّ"
          description="ملخّص يوميّ على بريدك بكلّ المسوّدات الجديدة."
          enabled={data.email_enabled}
          onChange={(v) => onChange({ email_enabled: v })}
        />
      </div>

      {errors.telegram_enabled && (
        <p className="text-sm text-danger" role="alert">{errors.telegram_enabled}</p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="send-hour" className="text-sm font-medium text-text-primary">
          الساعة المُفضَّلة للاستلام يوميًّا (بتوقيت الرياض)
        </label>
        <input
          id="send-hour"
          type="number"
          min={0}
          max={23}
          value={data.preferred_send_hour}
          onChange={(e) => onChange({ preferred_send_hour: Number(e.target.value) })}
          className={cn(
            "w-full md:w-40 px-4 py-2.5 rounded-lg",
            "bg-bg-elevated text-text-primary",
            "border border-border",
            "focus:outline-none focus:ring-2 focus:ring-accent-lawyer focus:border-transparent",
            "transition-colors duration-150 font-mono"
          )}
        />
        <p className="text-xs text-text-secondary">
          الافتراضيّ: 8 صباحًا. يُمكنك تغييرها لاحقًا من إعدادات حسابك.
        </p>
        {errors.preferred_send_hour && (
          <p className="text-xs text-danger" role="alert">{errors.preferred_send_hour}</p>
        )}
      </div>

      {data.telegram_enabled && (
        <div className="p-4 rounded-lg border border-accent-lawyer/30 bg-accent-lawyer/5">
          <p className="text-sm text-text-primary mb-2 font-medium">
            🤖 لتفعيل Telegram بعد التسجيل:
          </p>
          <ol className="text-xs text-text-secondary list-decimal pr-4 space-y-1 leading-relaxed">
            <li>ابحث عن البوت: <code className="font-mono text-accent-lawyer">@LawyerIDSA_bot</code></li>
            <li>أرسل له <code className="font-mono text-accent-lawyer">/start</code></li>
            <li>سيُرسل لك رمز تفعيل — ألصِقه في صفحة حسابك بعد التسجيل.</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export { StepNotifications };
'@
Write-FileUtf8NoBom 'components\signup\step-notifications.tsx' $content7

# ------------------------------------------------------------
# 8) lib/signup/types.ts (REWRITTEN — add concise to Tone)
# ------------------------------------------------------------
$content8 = @'
/**
 * Signup Wizard — Type Definitions
 * Phase 4.2ب-1 — Tone expanded to 5 values (added concise)
 */

export type SampleWriting = {
  platform: "x" | "blog" | "linkedin";
  topic: string;
  text: string;
};

export type Tone =
  | "formal"
  | "friendly"
  | "educational"
  | "analytical"
  | "concise";

export type PreferredLength = "short_tweet" | "medium_post" | "long_article";

export interface SignupFormData {
  // Step 1 — Basic Info
  full_name: string;
  email: string;
  phone: string;
  license_number: string;
  x_handle: string;
  blog_url: string;
  bio_short: string;

  // Step 2 — Specialty (MVP: commercial only)
  specialty_slug: string;

  // Step 3 — Writing Style
  target_audience: string;
  tone: Tone | "";
  preferred_length: PreferredLength | "";
  favorite_phrases: string[];
  avoided_phrases: string[];
  style_notes: string;

  // Step 4 — Writing Samples
  sample_writings: SampleWriting[];

  // Step 5 — Notification Preferences
  telegram_enabled: boolean;
  email_enabled: boolean;
  preferred_send_hour: number;
}

export const INITIAL_FORM_DATA: SignupFormData = {
  // Step 1
  full_name: "",
  email: "",
  phone: "",
  license_number: "",
  x_handle: "",
  blog_url: "",
  bio_short: "",

  // Step 2
  specialty_slug: "commercial",

  // Step 3
  target_audience: "",
  tone: "",
  preferred_length: "",
  favorite_phrases: [],
  avoided_phrases: [],
  style_notes: "",

  // Step 4
  sample_writings: [],

  // Step 5
  telegram_enabled: true,
  email_enabled: true,
  preferred_send_hour: 8,
};
'@
Write-FileUtf8NoBom 'lib\signup\types.ts' $content8

# ------------------------------------------------------------
# 9) app/signup/page.tsx (REWRITTEN — wire Steps 2-5)
# ------------------------------------------------------------
$content9 = @'
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
'@
Write-FileUtf8NoBom 'app\signup\page.tsx' $content9

# ------------------------------------------------------------
# Summary
# ------------------------------------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Phase 4.2ب-1 — 9 files written successfully" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Turbopack should hot-reload automatically." -ForegroundColor Gray
Write-Host "  2. Open http://localhost:3000/signup in your browser." -ForegroundColor Gray
Write-Host "  3. Test all 5 steps with the checklist provided." -ForegroundColor Gray
Write-Host "  4. If all OK, commit:" -ForegroundColor Gray
Write-Host "     git add ." -ForegroundColor DarkGray
Write-Host "     git commit -m 'feat(p4.2b-1): wire Steps 2-5 with full UI'" -ForegroundColor DarkGray
Write-Host "     git push origin main" -ForegroundColor DarkGray
Write-Host ""