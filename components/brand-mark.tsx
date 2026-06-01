import { cn } from "@/lib/utils";

interface BrandMarkProps {
  variant?: "lawyer" | "admin";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg",
};

const variantClasses = {
  lawyer: "border-lawyer text-lawyer",
  admin: "border-admin text-admin",
};

export function BrandMark({
  variant = "lawyer",
  size = "md",
  className,
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md border-2 font-mono font-bold",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      Li
    </div>
  );
}