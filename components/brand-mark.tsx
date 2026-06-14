import { cn } from "@/lib/utils";

interface BrandMarkProps {
  variant?: "lawyer" | "admin" | "pro" | "premium";
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
  pro: "border-pro text-pro",
  premium: "border-premium text-premium",
};

/**
 * علامة لام المرمزة: مربّع مؤطَّر يحمل النصّ «لام».
 * (تطوّرت من «Li» الخاصّة بـ Lawyer ID مع الحفاظ على نفس النمط البصريّ.)
 */
export function BrandMark({
  variant = "lawyer",
  size = "md",
  className,
}: BrandMarkProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-md border-2 font-bold leading-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      style={{ fontFamily: "var(--font-readex), var(--font-ibm), sans-serif" }}
      aria-label="لام"
    >
      لام
    </div>
  );
}
