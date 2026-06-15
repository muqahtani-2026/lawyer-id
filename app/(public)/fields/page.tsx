import Link from "next/link";
import { getActiveFields } from "@/lib/queries/public";

export const metadata = {
  title: "المجالات المهنيّة",
  description: "تصفّح المجالات المهنيّة على لام واعثر على المختصّين في كلّ مجال.",
};
export const revalidate = 300;

export default async function FieldsIndexPage() {
  const fields = await getActiveFields();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-content">المجالات المهنيّة</h1>
      <p className="mt-1 text-muted">اختر مجالًا لتصفّح المختصّين والمحتوى فيه.</p>

      {fields.length === 0 ? (
        <p className="mt-8 text-muted">لا مجالات متاحة بعد.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <Link
              key={f.id}
              href={`/fields/${encodeURIComponent(f.slug)}`}
              className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer"
            >
              <div className="text-lg font-semibold text-content">{f.name_ar}</div>
              {f.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{f.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
