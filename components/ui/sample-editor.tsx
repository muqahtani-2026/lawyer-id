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