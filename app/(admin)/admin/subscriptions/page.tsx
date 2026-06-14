import { getAllSubscriptions } from "@/lib/queries/admin-lam";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "الاشتراكات" };

export default async function AdminSubscriptionsPage() {
  const subs = await getAllSubscriptions();
  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">الاشتراكات</h1>
      <p className="mt-1 text-sm text-muted">اشتراكات المهنيّين وحالتها.</p>

      {subs.length === 0 ? (
        <p className="mt-6 text-muted">لا اشتراكات بعد.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-elevated text-right text-muted">
              <tr>
                <th className="p-3 font-medium">المهنيّ</th>
                <th className="p-3 font-medium">الباقة</th>
                <th className="p-3 font-medium">الحالة</th>
                <th className="p-3 font-medium">المزوّد</th>
                <th className="p-3 font-medium">المبلغ</th>
                <th className="p-3 font-medium">ينتهي</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} className="border-t border-line bg-card">
                  <td className="p-3 text-content">{s.user_name}</td>
                  <td className="p-3"><Badge tone={s.tier === "premium" ? "premium" : s.tier === "pro" ? "pro" : "neutral"} className="font-mono">{s.tier}</Badge></td>
                  <td className="p-3"><Badge tone={s.status === "active" ? "success" : "neutral"}>{s.status}</Badge></td>
                  <td className="p-3 text-muted" dir="ltr">{s.provider ?? "—"}</td>
                  <td className="p-3 font-mono text-muted" dir="ltr">{s.amount ? `${s.amount} ${s.currency ?? ""}` : "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("ar-SA") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
