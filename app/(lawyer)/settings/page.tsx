import { createClient } from "@/lib/supabase/server";
import { getMyNotificationPrefs } from "@/lib/queries/me";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const metadata = { title: "الإعدادات" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const prefs = await getMyNotificationPrefs();

  let xConnected = false;
  if (user) {
    const { count } = await supabase
      .from("lawyer_x_credentials")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", user.id);
    xConnected = (count ?? 0) > 0;
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">الإعدادات</h1>
      <p className="mt-1 text-sm text-muted">حسابك وإشعاراتك وربط حساباتك.</p>
      <div className="mt-6">
        {prefs ? (
          <SettingsForm initial={prefs} email={user?.email ?? null} xConnected={xConnected} />
        ) : (
          <p className="text-muted">تعذّر تحميل الإعدادات.</p>
        )}
      </div>
    </div>
  );
}
