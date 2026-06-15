import ConnectGuide, { type ConnectStep } from "@/components/connect/ConnectGuide";

// ⬇️ اضبط هذا على مسار بدء OAuth الفعليّ عندك (سنؤكّده من ConnectXButton لاحقًا)
const X_OAUTH_START = "/api/x/connect";

function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const steps: ConnectStep[] = [
  {
    title: "ابدأ الربط",
    detail: "اضغط زرّ «ربط حساب X الآن» في الأسفل، فتنتقل إلى موقع X الرسميّ لإتمام الإذن.",
    typeNote: "لا شيء — فقط اضغط الزرّ.",
  },
  {
    title: "سجّل الدخول في X",
    detail: "في صفحة X، أدخل اسم المستخدم وكلمة السرّ الخاصّين بحسابك على X. هذه البيانات تُدخَل في موقع X نفسه، ولا نراها نحن إطلاقًا.",
    typeNote: "اسم مستخدمك وكلمة سرّك في X (داخل موقع X).",
  },
  {
    title: "امنح الإذن",
    detail: "سيعرض X الأذونات المطلوبة (نشر التغريدات نيابةً عنك). اضغط «Authorize app» / «السماح».",
    typeNote: "لا تكتب شيئًا — فقط اضغط زرّ السماح.",
  },
  {
    title: "تمّ!",
    detail: "ستعود تلقائيًّا إلى لام، وسيظهر حسابك مربوطًا. يمكنك الآن النشر إلى X بضغطة من صفحة المراجعة.",
    typeNote: "لا شيء — اكتمل الربط.",
  },
];

export default function ConnectXPage() {
  return (
    <ConnectGuide
      homeHref="/profile"
      brandIcon={<XIcon size={20} />}
      headline={
        <>
          انشر حضورك على <span style={{ color: "#4a9eff" }}>X</span> بضغطة واحدة.
        </>
      }
      valueText="اربط حسابك مرّة واحدة، ودع المنصّة تنشر مسوّداتك المعتمَدة بأسلوبك — دون نسخ ولا لصق."
      title="ربط حساب X"
      steps={steps}
      connectHref={X_OAUTH_START}
      ctaLabel="ربط حساب X الآن"
      accent="#4a9eff"
    />
  );
}