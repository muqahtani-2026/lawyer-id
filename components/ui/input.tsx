import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, required, id, value, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
            {required && <span className="text-danger mr-1">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          dir="auto"
          value={value ?? ""}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg",
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

Input.displayName = "Input";

export { Input };