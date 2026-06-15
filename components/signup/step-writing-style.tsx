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
  { value: "analytical",  label: "تحليليّة", description: "تستخرج الدروس، مناسبة للزملاء المختصّين." },
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