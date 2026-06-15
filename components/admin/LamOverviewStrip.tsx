import Link from "next/link";
import { getLamOverview } from "@/lib/queries/admin-lam";

export async function LamOverviewStrip() {
  const o = await getLamOverview();
  const items: { label: string; value: number; href: string; accent: string }[] = [
    { label: "مهنيّون بانتظار الاعتماد", value: o.pendingApprovals, href: "/admin/approvals", accent: "text-premium" },
    { label: "أنظمة بانتظار المراجعة", value: o.ingestPending, href: "/admin/ingestion", accent: "text-lawyer" },
    { label: "مقالات بانتظار الإشراف", value: o.articlesPending, href: "/admin/articles?status=pending", accent: "text-warning" },
    { label: "أسئلة بانتظار", value: o.questionsPending, href: "/admin/questions", accent: "text-warning" },
    { label: "أجوبة بانتظار", value: o.answersPending, href: "/admin/questions", accent: "text-warning" },
    { label: "طلبات تواصل جديدة", value: o.leadsNew, href: "/admin/leads", accent: "text-premium" },
    { label: "مهنيّون", value: o.professionals, href: "/admin/lawyers", accent: "text-content" },
    { label: "اشتراكات نشطة", value: o.activeSubs, href: "/admin/subscriptions", accent: "text-success" },
  ];

  return (
    <section className="mb-10" aria-label="LAM moderation overview">
      <div className="mb-3 text-xs font-mono tracking-[2px]" style={{ color: "#fbbf24" }}>
        LAM · MODERATION
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {items.map((it) => (
          <Link key={it.label} href={it.href}
            className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-4 transition-colors hover:border-[#fbbf24]/40">
            <div className={`font-mono text-2xl font-bold ${it.accent}`}>{it.value}</div>
            <div className="mt-1 text-xs text-[#8892b0]">{it.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
