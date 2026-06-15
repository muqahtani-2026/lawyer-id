export default function Loading() {
  return (
    <div className="p-6 md:p-8">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-card" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border border-line bg-card" />
        ))}
      </div>
    </div>
  );
}
