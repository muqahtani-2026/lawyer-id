import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <BrandMark variant="lawyer" size="sm" />
              <span className="font-semibold text-content">لام</span>
            </div>
            <p className="mt-3 text-sm text-muted">
              منصّة حضورٍ مهنيّ — اجعل خبرتك مرئيّة، قابلةً للاكتشاف، وموثوقة.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <div className="font-medium text-content">استكشف</div>
              <Link href="/search" className="block text-muted hover:text-content">ابحث عن مختصّ</Link>
              <Link href="/articles" className="block text-muted hover:text-content">المقالات</Link>
              <Link href="/ask" className="block text-muted hover:text-content">اسأل مختصًّا</Link>
              <Link href="/fields" className="block text-muted hover:text-content">المجالات</Link>
              <Link href="/cities" className="block text-muted hover:text-content">المدن</Link>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-content">للمهنيّين</div>
              <Link href="/pricing" className="block text-muted hover:text-content">الباقات</Link>
              <Link href="/signup" className="block text-muted hover:text-content">انضمّ إلى لام</Link>
              <Link href="/sign-in" className="block text-muted hover:text-content">تسجيل الدخول</Link>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-content">قانونيّ</div>
              <Link href="/legal/terms" className="block text-muted hover:text-content">الشروط</Link>
              <Link href="/legal/privacy" className="block text-muted hover:text-content">الخصوصيّة</Link>
              <Link href="/legal/disclaimer" className="block text-muted hover:text-content">إخلاء المسؤوليّة</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6 text-xs text-muted">
          <p>
            المحتوى المنشور على لام تعريفيٌّ عامّ، وليس استشارةً قانونيّة أو مهنيّة. المنصّة تُسهّل
            التواصل بين المهنيّ والجمهور ولا تقدّم الخدمة المهنيّة بنفسها.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} لام — جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
