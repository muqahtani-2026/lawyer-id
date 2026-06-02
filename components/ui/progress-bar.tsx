import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  steps?: string[];
}

export function ProgressBar({ current, total, steps }: ProgressBarProps) {
  const percent = Math.round((current / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted font-mono">
        <span>الخطوة {current} من {total}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-lawyer transition-all duration-500 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
      {steps && (
        <div className="flex justify-between text-xs pt-1">
          {steps.map((step, i) => (
            <span
              key={i}
              className={cn(
                "transition",
                i < current ? "text-lawyer font-semibold" : "text-muted"
              )}
            >
              {step}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}