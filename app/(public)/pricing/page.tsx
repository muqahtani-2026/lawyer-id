import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "الباقات" };

const tiers = [
  {
    name: "Free",
    price: "مجّانًا",
    tone: "neutral" as const,
    desc: "ابدأ ببناء صوتك المهنيّ.",
    features: ["توليد محتوًى محدود بأسلوبك", "ملف أساسيّ", "توصيل عبر Telegram وبريد"],
    cta: "ابدأ مجّانًا",
    highlight: false,
  },
  {
    name: "Pro",
    price: "~149 ريال/شهر",
    tone: "pro" as const,
    desc: "محتوًى منتظم ونشرٌ تلقائيّ.",
    features: [
      "كلّ مزايا Free",
      "توليد + جدولة + مكتبة",
      "نشر تلقائيّ على X و LinkedIn",
      "إحصاءات أساسيّة",
    ],
    cta: "اشترك في Pro",
    highlight: false,
  },
  {
    name: "Premium",
    price: "~369 ريال/شهر",
    tone: "premium" as const,
    desc: "الظهور والتواصل وجلب العملاء.",
    features: [
      "كلّ مزايا Pro",
      "ملف عامّ + نشر المقالات في الموقع",
      "الظهور في البحث والاكتشاف",
      "استقبال طلبات التواصل (Leads)",
      "الردّ على «اسأل مختصًّا»",
      "إحصاءات متقدّمة",
    ],
    cta: "اشترك في Premium",
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-content">باقات لام</h1>
        <p className="mt-2 text-muted">ابدأ مجّانًا، وارتقِ حين تريد الظهور واستقبال العملاء.</p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border bg-card p-6 ${
              t.highlight ? "border-premium shadow-lg" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-content">{t.name}</h2>
              {t.name !== "Free" && <Badge tone={t.tone} className="font-mono">{t.name}</Badge>}
            </div>
            <div className="mt-2 text-2xl font-bold text-content">{t.price}</div>
            <p className="mt-1 text-sm text-muted">{t.desc}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-content/90">
                  <span className="text-success">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={buttonClasses(t.highlight ? "premium" : "primary", "md", "mt-6 w-full")}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        الأسعار توضيحيّة وتُحدَّد نهائيًّا قبل تفعيل الدفع. لام لا تقتسم أتعاب المهنيّ.
      </p>
    </div>
  );
}
