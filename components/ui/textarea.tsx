import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, required, id, value, rows = 4, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required && <span className="text-danger mr-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          dir="auto"
          value={value ?? ""}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg resize-y",
            "bg-bg-elevated text-text-primary",
            "border border-border",
            "placeholder:text-text-secondary",
            "focus:outline-none focus:ring-2 focus:ring-accent-lawyer focus:border-transparent",
            "transition-colors duration-150",
            error && "border-danger focus:ring-danger",
            className
          )}
          aria-invalid={error ? "true" : "false"}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-text-secondary">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };