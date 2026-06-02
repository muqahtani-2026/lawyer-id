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