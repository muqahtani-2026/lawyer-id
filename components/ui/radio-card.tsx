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