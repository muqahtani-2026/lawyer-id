import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDraftsForReview, getStatusCounts } from "@/lib/queries/review";
import { DraftCard } from "@/components/review/DraftCard";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    page?: string;
  }>;
}

const VALID_STATUSES = ["all", "pending", "approved", "rejected", "published"] as const;

const tabConfig: { key: string; label: string; countKey: keyof Awaited<ReturnType<typeof getStatusCounts>> }[] = [
  { key: "all",       label: "الكلّ",        countKey: "all" },
  { key: "pending",   label: "بانتظار",      countKey: "pending" },
  { key: "approved",  label: "مقبولة",       countKey: "approved" },
  { key: "rejected",  label: "مرفوضة",       countKey: "rejected" },
  { key: "published", label: "منشورة",       countKey: "published" },
];

export default async function ReviewPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as typeof VALID_STATUSES[number])
    ? params.status!
    : "all";
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [{ drafts, total, totalPages, pageSize }, counts] = await Promise.all([
    getDraftsForReview(user.id, { status, search, page }),
    getStatusCounts(user.id),
  ]);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { status, q: search, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all" && v !== "" && !(k === "page" && v === "1")) {
        sp.set(k, v);
      }
    }
    const qs = sp.toString();
    return qs ? `/review?${qs}` : "/review";
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <h1
          className="text-2xl md:text-3xl font-bold text-[#e6f1ff] mb-1"
          style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
        >
          المُسَوَّدات
        </h1>
        <p className="text-sm text-[#8892b0]">
          راجع، عدّل، وافق، أو ارفض المسوّدات المُولَّدة بأسلوبك.
        </p>
      </header>

      {/* Tabs */}
      <nav className="flex items-center gap-1 border-b border-[#1d3461] overflow-x-auto -mx-2 px-2 pb-px">
        {tabConfig.map((tab) => {
          const isActive = status === tab.key;
          const count = counts[tab.countKey];
          return (
            <Link
              key={tab.key}
              href={buildUrl({ status: tab.key, page: "1" })}
              className={cn(
                "inline-flex items-center gap-2 px-3 md:px-4 py-2.5 text-sm rounded-t-md transition-colors whitespace-nowrap border-b-2",
                isActive
                  ? "border-[#4a9eff] text-[#4a9eff] bg-[#152a4a]/40"
                  : "border-transparent text-[#8892b0] hover:text-[#e6f1ff] hover:bg-[#152a4a]/30"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded min-w-[20px] text-center",
                  isActive ? "bg-[#4a9eff] text-[#0a192f]" : "bg-[#1d3461] text-[#8892b0]"
                )}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Search */}
      <form method="GET" action="/review" className="flex items-center gap-2">
        {/* Preserve status filter via hidden field */}
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <div className="flex-1 relative">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892b0] pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={search}
            placeholder="ابحث في العناوين والملخّصات..."
            className="w-full pr-10 pl-3 py-2.5 bg-[#0f1f3d] border border-[#1d3461] focus:border-[#4a9eff] rounded-md text-[#e6f1ff] text-sm outline-none transition-colors placeholder:text-[#8892b0]"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#4a9eff] hover:bg-[#3a8eef] text-white text-sm font-medium rounded-md transition-colors"
        >
          بحث
        </button>
        {search && (
          <Link
            href={buildUrl({ q: "", page: "1" })}
            className="px-3 py-2.5 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
          >
            مسح
          </Link>
        )}
      </form>

      {/* Results summary */}
      {(search || status !== "all") && (
        <div className="text-xs text-[#8892b0]">
          {total === 0
            ? "لا توجد نتائج"
            : `${total} ${total === 1 ? "نتيجة" : "نتيجة"}`}
          {search && <span> للبحث عن &laquo;{search}&raquo;</span>}
        </div>
      )}

      {/* List */}
      {drafts.length === 0 ? (
        <div className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#152a4a] mb-4">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4a9eff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h3 className="text-base text-[#e6f1ff] font-medium mb-2">
            {search ? "لا توجد مسوّدات مطابقة" : "لا توجد مسوّدات بعد"}
          </h3>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            {search
              ? "جرّب كلمات بحث أخرى أو امسح الفلتر."
              : "ستظهر المسوّدات هنا بمجرّد تشغيل وكيل المحتوى."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <DraftCard draft={draft} />
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-between pt-4 border-t border-[#1d3461]">
          <div className="text-xs text-[#8892b0]">
            صفحة <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{page}</span> من{" "}
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totalPages}</span>
            {" "}— إجماليّ <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{total}</span>{" "}
            {total === 1 ? "مسوّدة" : "مسوّدة"}
          </div>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-1.5 bg-[#152a4a] hover:bg-[#1d3461] text-[#e6f1ff] text-sm rounded-md transition-colors"
              >
                السابق
              </Link>
            ) : (
              <span className="px-3 py-1.5 bg-[#0a192f] text-[#8892b0] text-sm rounded-md cursor-not-allowed">
                السابق
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 bg-[#4a9eff] hover:bg-[#3a8eef] text-white text-sm rounded-md transition-colors"
              >
                التالي
              </Link>
            ) : (
              <span className="px-3 py-1.5 bg-[#0a192f] text-[#8892b0] text-sm rounded-md cursor-not-allowed">
                التالي
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
