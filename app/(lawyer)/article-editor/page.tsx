import Link from "next/link";
import { notFound } from "next/navigation";
import { getDraftById, getMyArticleById } from "@/lib/queries/me";
import { ArticleEditor } from "@/components/dashboard/ArticleEditor";

export const metadata = { title: "محرّر المقال" };

export default async function ArticleEditorPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string; article?: string }>;
}) {
  const { draft, article } = await searchParams;

  if (draft) {
    const d = await getDraftById(draft);
    if (!d) notFound();
    return (
      <Shell title="تحرير ونشر مقال" subtitle="عدّل المحتوى قبل إرساله للمراجعة.">
        <ArticleEditor
          mode="compose"
          draftId={d.id}
          initial={{ title: d.draft_title ?? "", excerpt: d.draft_summary ?? "", body: d.draft_content ?? "" }}
        />
      </Shell>
    );
  }

  if (article) {
    const a = await getMyArticleById(article);
    if (!a) notFound();
    return (
      <Shell title="تحرير مقال" subtitle="عدّل المقال؛ ستُراجَع التعديلات قبل الظهور.">
        <ArticleEditor
          mode="edit"
          articleId={a.id}
          initial={{
            title: a.title ?? "",
            excerpt: a.excerpt ?? "",
            body: a.body ?? "",
            seo_title: a.seo_title ?? "",
            seo_description: a.seo_description ?? "",
          }}
        />
      </Shell>
    );
  }

  notFound();
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="p-6 md:p-8">
      <Link href="/my-articles" className="text-sm text-muted hover:text-content">← مقالاتي</Link>
      <h1 className="mt-2 text-2xl font-bold text-content">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
