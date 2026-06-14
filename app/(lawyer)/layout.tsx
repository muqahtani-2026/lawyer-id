import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default async function LawyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.full_name ?? user.email?.split("@")[0] ?? "مهنيّ";
  const email = user.email ?? "";
  const isAdmin = profile?.is_admin ?? false;

  return (
    <div
      className="min-h-screen bg-[#0a192f] text-[#e6f1ff] flex"
      dir="rtl"
    >
      <Sidebar
        displayName={displayName}
        email={email}
        isAdmin={isAdmin}
      />
      <main className="flex-1 overflow-x-hidden pb-20 md:pb-0">{children}</main>
      <MobileNav isAdmin={isAdmin} />
    </div>
  );
}