"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-content">حدث خطأ غير متوقّع</h1>
      <p className="mt-2 text-muted">تعذّر تحميل هذه الصفحة. حاول مجدّدًا.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className={buttonClasses("primary", "md")}>إعادة المحاولة</button>
        <Link href="/" className={buttonClasses("ghost", "md")}>الرئيسة</Link>
      </div>
    </div>
  );
}
