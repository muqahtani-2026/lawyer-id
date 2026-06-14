import { getAllLeads } from "@/lib/queries/admin-lam";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "طلبات التواصل" };

const channelLabel: Record<string, string> = { whatsapp: "واتساب", call: "اتصال", email: "بريد", form: "نموذج" };

export default async function AdminLeadsPage() {
  const leads = await getAllLeads();
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">طلبات التواصل (المنصّة)</h1>
      <p className="mt-1 text-sm text-muted">عرضٌ إداريّ لكلّ طلبات التواصل عبر المنصّة.</p>

      {leads.length === 0 ? (
        <p className="mt-6 text-muted">لا طلبات بعد.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-elevated text-right text-muted">
              <tr>
                <th className="p-3 font-medium">المهنيّ</th>
                <th className="p-3 font-medium">الزائر</th>
                <th className="p-3 font-medium">القناة</th>
                <th className="p-3 font-medium">الحالة</th>
                <th className="p-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-line bg-card">
                  <td className="p-3 text-content">{l.professional_name}</td>
                  <td className="p-3 text-muted">{l.visitor_name || "—"}{l.visitor_contact ? ` · ${l.visitor_contact}` : ""}</td>
                  <td className="p-3 text-muted">{channelLabel[l.channel ?? ""] ?? l.channel}</td>
                  <td className="p-3"><Badge tone={l.status === "new" ? "warning" : l.status === "handled" ? "success" : "neutral"}>{l.status}</Badge></td>
                  <td className="p-3 font-mono text-xs text-muted">{new Date(l.created_at).toLocaleDateString("ar-SA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
