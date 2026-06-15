export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-card" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl border border-line bg-card" />
        ))}
      </div>
    </div>
  );
}
