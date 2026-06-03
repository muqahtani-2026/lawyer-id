import { listLawyers } from "@/lib/queries/admin-lawyers";
import { LawyersTable } from "@/components/admin/LawyersTable";

export default async function AdminLawyersPage() {
  const lawyers = await listLawyers();

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto" style={{ direction: "rtl" }}>
      <header className="mb-10">
        <div className="flex items-baseline gap-3 mb-2">
          <span
            className="text-xs font-mono tracking-[2px]"
            style={{ color: "#fbbf24" }}
          >
            ADMIN · LAWYERS
          </span>
          <span className="text-xs font-mono tracking-wider text-[#8892b0]">
            {lawyers.length}{" "}
            {lawyers.length === 1 ? "محامي" : "محامين"}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          المحامون
        </h1>
        <p className="text-[#8892b0] leading-relaxed max-w-2xl">
          جميع المحامين المسجَّلين على المنصّة. اضغط على أيّ صفّ لعرض
          التفاصيل الكاملة.
        </p>
      </header>

      <LawyersTable lawyers={lawyers} />
    </div>
  );
}
