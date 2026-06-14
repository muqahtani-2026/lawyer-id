import { getMyLeads } from "@/lib/queries/me";
import { LeadStatusControl } from "@/components/dashboard/MeControls";

export const metadata = { title: "طلبات التواصل" };

const channelLabel: Record<string, string> = {
  whatsapp: "واتساب",
  call: "اتصال",
  email: "بريد",
  form: "نموذج",
};
const sourceLabel: Record<string, string> = {
  profile: "الملف",
  article: "مقال",
  search: "البحث",
  other: "أخرى",
};

export default async function LeadsPage() {
  const leads = await getMyLeads();

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">طلبات التواصل</h1>
      <p className="mt-1 text-sm text-muted">من تواصل معك عبر ملفك ومقالاتك. (ميزة Premium.)</p>

      {leads.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line bg-card p-10 text-center text-muted">
          لا طلبات بعد — انشر مقالًا وفعّل ملفك العام ليجدك العملاء.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {leads.map((l) => (
            <div key={l.id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-medium text-content">{l.visitor_name || "زائر"}</span>
                  {l.visitor_contact && (
                    <span className="ms-2 font-mono text-sm text-lawyer" dir="ltr">{l.visitor_contact}</span>
                  )}
                </div>
                <LeadStatusControl id={l.id} status={l.status} />
              </div>
              {l.message && <p className="mt-2 text-sm text-muted">{l.message}</p>}
              <div className="mt-2 text-xs text-muted">
                عبر {channelLabel[l.channel ?? ""] ?? l.channel} · من {sourceLabel[l.source] ?? l.source}
                {" · "}
                {new Date(l.created_at).toLocaleDateString("ar-SA")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
