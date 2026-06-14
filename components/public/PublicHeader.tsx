import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buttonClasses } from "@/components/ui/button";

const navLinks = [
  { href: "/search", label: "ابحث عن مختصّ" },
  { href: "/articles", label: "المقالات" },
  { href: "/ask", label: "اسأل مختصًّا" },
  { href: "/pricing", label: "للمهنيّين" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-base/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark variant="lawyer" size="sm" />
          <div className="leading-tight">
            <div className="font-semibold text-content">لام</div>
            <div className="font-mono text-[10px] tracking-wider text-muted">
              SAUDI · PROFESSIONAL
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors hover:text-content"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/sign-in" className={buttonClasses("ghost", "sm")}>
            دخول المهنيّين
          </Link>
          <Link href="/signup" className={buttonClasses("primary", "sm", "hidden sm:inline-flex")}>
            ابدأ مجّانًا
          </Link>
        </div>
      </div>
    </header>
  );
}
