import { getMyStats } from "@/lib/queries/me";

export async function FunnelStrip() {
  const s = await getMyStats();
  const views = (Number(s.profile_views) || 0) + (Number(s.article_views) || 0);
  const clicks = Number(s.contact_clicks) || 0;
  const leads = Number(s.leads_total) || 0;

  const stages = [
    { label: "المشاهدات (ملف + مقالات)", value: views, color: "bg-lawyer" },
    { label: "نقرات التواصل", value: clicks, color: "bg-pro" },
    { label: "عملاء محتملون", value: leads, color: "bg-premium" },
  ];
  const max = Math.max(views, 1);

  return (
    <section aria-label="مسار التحويل" className="rounded-xl border border-line bg-card p-5">
      <h3 className="mb-4 text-sm font-medium text-content">مسار التحويل</h3>
      <div className="space-y-3">
        {stages.map((st) => {
          const pct = Math.round((st.value / max) * 100);
          return (
            <div key={st.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>{st.label}</span>
                <span className="font-mono text-content">{st.value}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-base">
                <div className={`h-full rounded-full ${st.color}`} style={{ width: `${Math.max(pct, st.value > 0 ? 6 : 0)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      {views === 0 && (
        <p className="mt-3 text-xs text-muted">سيمتلئ المسار فور بدء الزوّار بزيارة ملفك ومقالاتك.</p>
      )}
    </section>
  );
}
