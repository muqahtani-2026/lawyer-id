import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "lawyer" | "pro" | "premium" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "border-line text-muted",
  lawyer: "border-lawyer text-lawyer",
  pro: "border-pro text-pro",
  premium: "border-premium text-premium",
  success: "border-success text-success",
  warning: "border-warning text-warning",
  danger: "border-danger text-danger",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** شارة الباقة (Pro/Premium) — Free بلا شارة. */
export function TierBadge({ tier }: { tier?: string | null }) {
  if (tier === "premium") return <Badge tone="premium" className="font-mono">Premium</Badge>;
  if (tier === "pro") return <Badge tone="pro" className="font-mono">Pro</Badge>;
  return null;
}
