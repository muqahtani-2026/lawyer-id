import Link from "next/link";
import ConnectXButton from "@/components/ConnectXButton";

/**
 * بطاقة Pro في صفحة المِلَفّ:
 * - للمحامي Free: تعريف بمزايا Pro + خطوات (1 اشترك ← 2 اربط X ← 3 LinkedIn قريبًا).
 *   زرّ الاشتراك placeholder حاليًّا (الدفع = Phase 9، الترقية تُمنح يدويًّا للمختبِرين).
 * - للمحامي Pro: مؤشّر تقدّم الربط + زرّ ربط X الفعليّ.
 *
 * Server component — يُستدعى من app/(lawyer)/profile/page.tsx.
 */

const PRO_FEATURES: { icon: string; text: string }[] = [
  { icon: "⚡", text: "نشر فوريّ على X بضغطة من صفحة المراجعة" },
  { icon: "📅", text: "جدولة النشر بالوقت الذي تختار — يُنشر وحده" },
  { icon: "📚", text: "مكتبة قانونيّة شخصيّة: ارفع ملفّاتك وتستقي المسوّدات منها" },
  { icon: "🔗", text: "LinkedIn auto-publish (قريبًا)" },
];

function StepBadge({
  n,
  done,
  active,
}: {
  n: number;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <span
      className={
        "inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold shrink-0 " +
        (done
          ? "bg-[#0a3a1a] border-[#4ade80]/40 text-[#4ade80]"
          : active
            ? "bg-[#152a4a] border-[#a855f7]/50 text-[#a855f7]"
            : "bg-[#0a192f] border-[#1d3461] text-[#8892b0]")
      }
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {done ? "✓" : n}
    </span>
  );
}

export function ProUpgradeCard({
  isPro,
  xUsername,
}: {
  isPro: boolean;
  xUsername: string | null;
}) {
  const xConnected = !!xUsername;

  // ====== حالة Pro: مؤشّر تقدّم الربط ======
  if (isPro) {
    return (
      <section className="bg-[#0f1f3d] border border-[#a855f7]/30 rounded-lg p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-semibold text-[#e6f1ff] inline-flex items-center gap-2">
            <span
              className="text-[10px] px-2 py-0.5 rounded bg-[#a855f7]/15 border border-[#a855f7]/40 text-[#a855f7]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Pro
            </span>
            النشر التلقائيّ — أكمل الربط
          </h2>
        </div>

        <ol className="space-y-3">
          {/* الخطوة 1: الاشتراك */}
          <li className="flex items-center gap-3">
            <StepBadge n={1} done />
            <span className="text-sm text-[#e6f1ff]">
              الاشتراك في Pro
              <span className="text-xs text-[#4ade80] mr-2">— مفعَّل ✓</span>
            </span>
          </li>

          {/* الخطوة 2: ربط X */}
          <li className="flex items-center gap-3 flex-wrap">
            <StepBadge n={2} done={xConnected} active={!xConnected} />
            <span className="text-sm text-[#e6f1ff] inline-flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              ربط حساب X
            </span>
            <span className="mr-auto">
              <ConnectXButton isPro={isPro} connectedUsername={xUsername} />
            </span>
          </li>

          {/* الخطوة 3: LinkedIn قريبًا */}
          <li className="flex items-center gap-3 opacity-60">
            <StepBadge n={3} />
            <span className="text-sm text-[#8892b0]">
              ربط LinkedIn
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152a4a] border border-[#1d3461] text-[#8892b0] mr-2">
                قريبًا
              </span>
            </span>
          </li>
        </ol>

        {xConnected && (
          <p className="text-xs text-[#4ade80] pt-1 border-t border-[#1d3461]">
            كلّ شيء جاهز — من صفحة المراجعة: «نشر إلى X» فورًا أو «جدولة النشر»، وتابع
            المجدوَل في{" "}
            <Link href="/schedule" className="text-[#4a9eff] hover:underline">
              جدول النشر
            </Link>
            .
          </p>
        )}
      </section>
    );
  }

  // ====== حالة Free: بطاقة الترقية ======
  return (
    <section className="bg-[#0f1f3d] border border-[#a855f7]/30 rounded-lg p-4 md:p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[#e6f1ff] inline-flex items-center gap-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded bg-[#a855f7]/15 border border-[#a855f7]/40 text-[#a855f7]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Pro
          </span>
          انشر بأسلوبك — تلقائيًّا
        </h2>
        <p className="text-xs text-[#8892b0] mt-1">
          باقتك الحاليّة Free: المسوّدات تصلك عبر Telegram والبريد وتظهر هنا. مع Pro تنشرها
          وتجدولها بنفسك بضغطة.
        </p>
      </div>

      <ul className="space-y-2">
        {PRO_FEATURES.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5 text-sm text-[#e6f1ff]">
            <span className="shrink-0">{f.icon}</span>
            <span className="leading-relaxed">{f.text}</span>
          </li>
        ))}
      </ul>

      {/* الخطوات */}
      <div className="pt-3 border-t border-[#1d3461]">
        <div className="text-xs text-[#8892b0] mb-3">كيف تبدأ؟ ثلاث خطوات:</div>
        <ol className="space-y-2.5">
          <li className="flex items-center gap-3">
            <StepBadge n={1} active />
            <span className="text-sm text-[#e6f1ff]">اشترك في Pro</span>
          </li>
          <li className="flex items-center gap-3 opacity-60">
            <StepBadge n={2} />
            <span className="text-sm text-[#8892b0]">اربط حساب X من هذه الصفحة</span>
          </li>
          <li className="flex items-center gap-3 opacity-60">
            <StepBadge n={3} />
            <span className="text-sm text-[#8892b0]">
              اربط LinkedIn{" "}
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#152a4a] border border-[#1d3461]">
                قريبًا
              </span>
            </span>
          </li>
        </ol>
      </div>

      {/* زرّ الاشتراك — placeholder حتّى Phase 9 */}
      <div className="flex items-center gap-3 flex-wrap pt-1">
        <button
          disabled
          title="الاشتراك المدفوع يُفتح قريبًا"
          className="px-5 py-2.5 bg-[#a855f7]/20 border border-[#a855f7]/40 text-[#a855f7] text-sm font-medium rounded-md cursor-not-allowed"
        >
          الاشتراك في Pro — قريبًا
        </button>
        <span className="text-xs text-[#8892b0]">
          مهتمّ بالتجربة المبكرة؟ تواصل معنا وسنفعّلها لك.
        </span>
      </div>
    </section>
  );
}
