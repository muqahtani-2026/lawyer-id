"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";

function SuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-border bg-bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark variant="lawyer" size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-semibold">Lawyer ID</span>
              <span className="text-[10px] font-mono text-text-secondary tracking-wider">
                SAUDI · LEGAL · COMMERCIAL
              </span>
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-bg-card border border-border rounded-xl p-8 md:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            تمّ تسجيلك بنجاح
          </h1>

          <p className="text-text-secondary text-lg mb-2">
            مرحبًا بك في <span className="text-accent-lawyer font-medium">Lawyer ID</span>.
          </p>

          {email && (
            <p className="text-text-secondary mb-8">
              تمّ إنشاء حسابك بالبريد: <span className="font-mono text-text-primary">{email}</span>
            </p>
          )}

          <div className="bg-bg-elevated rounded-lg p-6 mb-8 text-right">
            <h2 className="font-display font-semibold mb-3">الخطوات التالية</h2>
            <ul className="space-y-2 text-text-secondary text-sm leading-relaxed">
              <li>• سيراجع فريقنا طلبك خلال 24 ساعة.</li>
              <li>• سنتواصل معك عبر بريدك الإلكترونيّ لتأكيد الحساب.</li>
              <li>• ستبدأ في استلام المسوّدات اليوميّة بأسلوبك فور التفعيل.</li>
            </ul>
          </div>

          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium bg-accent-lawyer text-bg-primary hover:opacity-90 transition-colors"
          >
            العودة إلى الصفحة الرئيسة
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
      <SuccessContent />
    </Suspense>
  );
}