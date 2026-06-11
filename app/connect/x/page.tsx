import type { Metadata } from "next";
import ConnectGuide, { type ConnectStep } from "@/components/connect/ConnectGuide";

export const metadata: Metadata = {
  title: "ربط حساب X — Lawyer ID",
};

const XIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const STEPS: ConnectStep[] = [
  {
    title: "ابدأ الربط",
    detail:
      "اضغط زرّ «ربط حساب X الآن» أسفل الصفحة. ستنتقل مباشرةً إلى موقع X الرسميّ لإتمام الإذن.",
    typeNote: "لا شيء — فقط اضغط الزرّ.",
  },
  {
    title: "سجّل الدخول في X",
    detail:
      "إن لم تكن مسجّلًا دخولك في X، ستظهر صفحة دخول X الرسميّة. أدخل بياناتك هناك. وإن كنت داخلًا أصلًا، تُتخطّى هذه الخطوة تلقائيًّا.",
    typeNote: "اسم المستخدم أو البريد + كلمة المرور — في موقع X نفسه. نحن لا نراها.",
  },
  {
    title: "امنح الإذن",
    detail:
      "ستعرض X رسالة: «هل تسمح لتطبيق Lawyer ID بالنشر نيابةً عنك؟» مع قائمة الصلاحيّات. اضغط زرّ الموافقة «Authorize app».",
    typeNote: "لا شيء — فقط اضغط «Authorize».",
  },
  {
    title: "تمّ!",
    detail:
      "تعود تلقائيًّا إلى المنصّة وتظهر علامة «حساب X مربوط». الآن تنشر أيّ مسوّدة معتمَدة إلى X من صفحة المراجعة بضغطة. إن لم تظهر العلامة، أعد المحاولة أو راسِلنا.",
    typeNote: "لا شيء — اكتمل الربط.",
  },
];

// ⚠️ مهمّ: اضبط هذا ليطابق المسار الذي يبدأ به زرّ «اربط حساب X» الحاليّ (بدء OAuth 2.0 PKCE).
// مثال شائع: "/api/x/connect" أو "/api/auth/x". انسخ القيمة من زرّ /profile الحاليّ.
const X_OAUTH_START = "/api/x/connect";

export default function ConnectXPage() {
  return (
    <ConnectGuide
      title="ربط حساب X"
      intro="اربط حسابك مرّة واحدة لتنشر مسوّداتك المعتمَدة بضغطة. اضغط أيّ خطوة لعرض تفاصيلها الكاملة."
      steps={STEPS}
      connectHref={X_OAUTH_START}
      ctaLabel="ربط حساب X الآن"
      accent="#4a9eff"
      brandIcon={XIcon}
    />
  );
}
