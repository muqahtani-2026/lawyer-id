import Link from "next/link";
import { getActiveCities } from "@/lib/queries/public";

export const metadata = {
  title: "المدن",
  description: "تصفّح المهنيّين حسب المدينة على لام.",
};
export const revalidate = 300;

export default async function CitiesIndexPage() {
  const cities = await getActiveCities();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-content">المدن</h1>
      <p className="mt-1 text-muted">اختر مدينة لتصفّح المهنيّين فيها.</p>

      {cities.length === 0 ? (
        <p className="mt-8 text-muted">لا مدن متاحة بعد — ستظهر فور انضمام مهنيّين بملفّات عامّة.</p>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          {cities.map((c) => (
            <Link
              key={c.city}
              href={`/cities/${encodeURIComponent(c.city)}`}
              className="rounded-full border border-line bg-card px-4 py-2 text-sm text-content transition-colors hover:border-lawyer"
            >
              {c.city} <span className="font-mono text-muted">({c.count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
