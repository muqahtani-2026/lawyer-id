import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-content">
          {label}
        </label>
      )}
      <input
        {...props}
        className={cn(
          "w-full px-4 py-2.5 rounded-lg bg-elevated border border-line text-content",
          "placeholder:text-muted text-sm",
          "focus:outline-none focus:ring-2 focus:ring-lawyer focus:border-transparent transition",
          error && "border-danger",
          className
        )}
      />
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}