import GenerationProgress from "@/components/pro/GenerationProgress";

/**
 * /upgrade/success — تظهر بعد قبول الدفع مباشرةً.
 * ترحّب بالمحامي وتعرض عدّاد توليد الـ 30 مسوّدة حيًّا.
 */

export const dynamic = "force-dynamic";

export default function UpgradeSuccessPage() {
  return (
    <div
      style={{
        direction: "rtl",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(74,222,128,.12)",
            border: "1px solid rgba(74,222,128,.4)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "'Readex Pro', system-ui, sans-serif",
            fontSize: 26,
            color: "#e6f1ff",
            margin: "0 0 4px",
          }}
        >
          تمّ تفعيل اشتراك Pro
        </h1>
        <p style={{ fontSize: 14, color: "#8892b0", margin: 0 }}>
          أهلًا بك في Pro — نبدأ الآن بتجهيز محتواك.
        </p>
      </div>

      <GenerationProgress />
    </div>
  );
}
