import Link from "next/link";
import type { Metadata } from "next";
import { Badge, TierBadge } from "@/components/ui/badge";
import { searchProfessionals } from "@/lib/queries/public";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const name = decodeURIComponent(city);
  return {
    title: `مهنيّون في ${name}`,
    description: `اكتشف المختصّين في ${name} على لام — محامون ومستشارون وخبراء.`,
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const name = decodeURIComponent(city);
  const pros = await searchProfessionals(undefined, name, undefined);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-content">مهنيّون في {name}</h1>

      {pros.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line bg-card p-10 text-center text-muted">
          لا مهنيّون بعد في {name}.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pros.map((p) => (
            <Link key={p.id} href={`/pros/${encodeURIComponent(p.slug ?? p.id)}`}
              className="rounded-xl border border-line bg-card p-5 transition-colors hover:border-lawyer">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-content">{p.full_name}</div>
                <TierBadge tier={p.tier} />
              </div>
              {p.headline && <p className="mt-1 line-clamp-2 text-sm text-muted">{p.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.specialties?.slice(0, 2).map((s) => <Badge key={s.id} tone="neutral">{s.name}</Badge>)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
