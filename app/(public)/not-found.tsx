import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function PublicNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="font-mono text-5xl font-bold text-lawyer">٤٠٤</div>
      <h1 className="mt-4 text-2xl font-bold text-content">الصفحة غير موجودة</h1>
      <p className="mt-2 text-muted">قد يكون الرابط قديمًا أو أنّ المحتوى لم يَعُد متاحًا.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={buttonClasses("primary", "md")}>الصفحة الرئيسة</Link>
        <Link href="/search" className={buttonClasses("outline", "md")}>ابحث عن مختصّ</Link>
      </div>
    </div>
  );
}
