import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Lawyer ID — لوحة الإدارة",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen bg-[#0a192f] text-[#e6f1ff]"
      style={{ direction: "rtl" }}
    >
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
