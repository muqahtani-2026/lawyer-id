import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ConnectXButton from "@/components/ConnectXButton";
import PublishToXButton from "@/components/PublishToXButton";

export const dynamic = "force-dynamic";

/**
 * صفحة إعداد/اختبار مستقلّة للنشر على X.
 * تعرض: حالة الربط بـ X + قائمة مسوّدات المستخدم مع زرّ النشر.
 * لا تمسّ صفحات /profile أو /review الحاليّة — مؤقّتة للاختبار.
 * المسار: /x-setup
 */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a192f",
  color: "#e6f1ff",
  padding: "40px 24px",
  fontFamily: "system-ui, sans-serif",
  direction: "rtl",
};
const card: React.CSSProperties = {
  background: "#0f1f3d",
  border: "1px solid #1d3461",
  borderRadius: 12,
  padding: 20,
  margin: "16px auto",
  maxWidth: 680,
};
const draftBox: React.CSSProperties = {
  background: "#152a4a",
  border: "1px solid #1d3461",
  borderRadius: 10,
  padding: 16,
  marginTop: 12,
};

export default async function XSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={page}>
        <div style={card}>
          <p>سجّل الدخول أوّلًا ثمّ ارجع إلى هذه الصفحة.</p>
          <a href="/" style={{ color: "#4a9eff" }}>
            الصفحة الرئيسة
          </a>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  const isPro = profile?.tier === "pro";

  const { data: cred } = await supabaseAdmin
    .from("lawyer_x_credentials")
    .select("x_username")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: drafts } = await supabaseAdmin
    .from("content_drafts")
    .select("id, draft_title, draft_content, content_format")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main style={page}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>إعداد واختبار النشر على X</h1>
        <p style={{ color: "#8892b0" }}>صفحة مؤقّتة لاختبار الربط والنشر.</p>
      </div>

      <section style={card}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>الربط بحساب X</h2>
        <ConnectXButton isPro={isPro} connectedUsername={cred?.x_username ?? null} />
        {!isPro && (
          <p style={{ color: "#fbbf24", marginTop: 10 }}>
            النشر متاح لطبقة Pro فقط.
          </p>
        )}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>مسوّداتك</h2>
        {(!drafts || drafts.length === 0) && (
          <p style={{ color: "#8892b0" }}>لا توجد مسوّدات.</p>
        )}
        {drafts?.map((d) => (
          <div key={d.id} style={draftBox}>
            <div style={{ color: "#8892b0", fontSize: 13, marginBottom: 6 }}>
              {(d.draft_title as string) ?? "(بلا عنوان)"} ·{" "}
              <span style={{ color: "#4a9eff" }}>{d.content_format as string}</span>
            </div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, marginBottom: 12 }}>
              {d.draft_content as string}
            </p>
            <PublishToXButton draftId={d.id as string} isPro={isPro} />
          </div>
        ))}
      </section>
    </main>
  );
}
