import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  // Server-side: verify DB connection by counting specialties
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("specialties")
    .select("*", { count: "exact", head: true });

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark variant="lawyer" size="sm" />
            <span className="font-bold text-lg">Lawyer ID</span>
          </div>
          <Link href="/signup" className="text-sm text-lawyer hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <BrandMark variant="lawyer" size="lg" className="mb-8" />

        <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-3xl leading-tight">
          محتوى قانوني بأسلوبك.
          <br />
          <span className="text-lawyer">بدون عناء.</span>
        </h1>

        <p className="text-lg text-muted max-w-2xl mb-3">
          منصّة آليّة تُولّد لكلّ محامي مسوّدات قانونية أسبوعية بأسلوبه الشخصي،
          مستندةً إلى الأنظمة السعودية الموثّقة.
        </p>

        <p className="text-sm tracking-widest text-muted font-mono mb-10">
          SAUDI · LEGAL · COMMERCIAL
        </p>

        <Link
          href="/signup"
          className="inline-flex items-center justify-center px-8 py-4 bg-lawyer rounded-lg font-semibold text-base hover:opacity-90 transition"
          style={{ color: "#0a192f" }}
        >
          ابدأ التسجيل المجّاني
        </Link>

        {/* DB Connection Indicator */}
        <p className="mt-8 text-xs text-muted font-mono">
          {error
            ? `! DB error: ${error.message}`
            : `OK Supabase connected | ${count ?? 0} specialties`}
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-line bg-card">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="text-3xl">📝</div>
            <h3 className="text-xl font-bold">أسلوبك الشخصي</h3>
            <p className="text-sm text-muted leading-relaxed">
              نتعلّم نبرتك من أمثلة كتاباتك السابقة، فتأتي المسوّدات قريبة من
              صوتك، لا قوالب جاهزة.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">⚖️</div>
            <h3 className="text-xl font-bold">مراجع موثّقة</h3>
            <p className="text-sm text-muted leading-relaxed">
              كلّ مادة نظامية تُذكر موثّقة في قاعدة الأنظمة السعودية. لا
              اختراع، لا تخمين.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">📬</div>
            <h3 className="text-xl font-bold">تصل إليك</h3>
            <p className="text-sm text-muted leading-relaxed">
              المسوّدات تصل عبر Telegram أو Email في الموعد الذي تختاره.
              مراجعة، تعديل، نشر — في خمس دقائق.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-muted">
          © 2026 Lawyer ID — منصّة المحتوى القانوني للمحامين السعوديين
        </div>
      </footer>
    </main>
  );
}