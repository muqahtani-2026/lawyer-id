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