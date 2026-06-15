export const dynamic = "force-dynamic";

const CSS = `
.up-root{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a192f;color:#e6f1ff;direction:rtl;font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;padding:24px}
.up-card{width:100%;max-width:420px;background:#0f1f3d;border:1px solid #1d3461;border-radius:18px;padding:32px 28px;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.up-badge{display:inline-flex;align-items:center;gap:6px;background:#231640;border:1px solid #a855f7;color:#cbb6f6;font-size:12px;padding:4px 12px;border-radius:999px;margin-bottom:16px}
.up-h1{font-family:'Readex Pro',sans-serif;font-size:23px;font-weight:600;margin:0 0 8px}
.up-price{font-size:15px;color:#8892b0;margin:0 0 22px}
.up-price b{color:#e6f1ff;font-size:26px;font-family:'Readex Pro',sans-serif}
.up-list{list-style:none;margin:0 0 24px;padding:0;display:flex;flex-direction:column;gap:13px}
.up-li{display:flex;align-items:center;gap:10px;font-size:13.5px;color:#dbe7fb}
.up-dot{flex:none;width:20px;height:20px;border-radius:6px;background:#152a4a;border:1px solid #234268;color:#4ade80;display:flex;align-items:center;justify-content:center;font-size:12px}
.up-btn{width:100%;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;font-family:inherit;color:#0a192f;background:#a855f7;cursor:pointer}
.up-err{background:#3a1620;border:1px solid #ef4444;color:#fca5a5;font-size:12.5px;border-radius:10px;padding:9px 12px;margin-bottom:16px}
`;

const FEATURES = [
  "رفع ملفّاتك الخاصّة وبناء مكتبتك القانونيّة.",
  "نشر تلقائيّ إلى X وLinkedIn بضغطة.",
  "جدولة النشر في الوقت الذي تختاره.",
  "إحصاءات النشر.",
];

const ERRORS: Record<string, string> = {
  init: "تعذّر بدء الدفع. حاول مجدّدًا.",
  tap: "حدث خطأ مع بوّابة الدفع. حاول مجدّدًا.",
  notpaid: "لم يكتمل الدفع. لم نفعّل الاشتراك.",
  missing: "طلب غير مكتمل.",
  server: "خطأ غير متوقّع. حاول مجدّدًا.",
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const price = process.env.PRO_PRICE_SAR ?? "109";
  const errMsg = sp?.error ? ERRORS[sp.error] ?? "حدث خطأ." : null;

  return (
    <div className="up-root">
      <style>{CSS}</style>
      <div className="up-card">
        <span className="up-badge">لام Pro</span>
        <h1 className="up-h1">ترقية إلى Pro</h1>
        <p className="up-price">
          <b>{price}</b> ريال / شهر
        </p>

        {errMsg && <div className="up-err">{errMsg}</div>}

        <ul className="up-list">
          {FEATURES.map((f) => (
            <li key={f} className="up-li">
              <span className="up-dot">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <form action="/api/billing/checkout" method="get">
          <button type="submit" className="up-btn">
            ترقية إلى Pro الآن
          </button>
        </form>
      </div>
    </div>
  );
}
