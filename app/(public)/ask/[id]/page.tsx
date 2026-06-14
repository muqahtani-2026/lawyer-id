import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuestionWithAnswers } from "@/lib/queries/public";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getQuestionWithAnswers(id);
  if (!data) return { title: "سؤال غير موجود" };
  return { title: data.question.title, description: data.question.body?.slice(0, 150) };
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getQuestionWithAnswers(id);
  if (!data) notFound();
  const { question, answers } = data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: question.title,
        acceptedAnswer: answers.length
          ? { "@type": "Answer", text: answers[0].body }
          : undefined,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-muted">
        <Link href="/ask" className="hover:text-content">اسأل مختصًّا</Link>
      </nav>

      <h1 className="mt-3 text-2xl font-bold text-content">{question.title}</h1>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{question.body}</p>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-content">الإجابات</h2>
        {answers.length === 0 ? (
          <p className="text-sm text-muted">لا إجابات منشورة بعد.</p>
        ) : (
          answers.map((a) => (
            <div key={a.id} className="rounded-xl border border-line bg-card p-5">
              <p className="whitespace-pre-line leading-relaxed text-content/90">{a.body}</p>
            </div>
          ))
        )}
      </div>

      <p className="mt-8 rounded-lg border border-line bg-card p-4 text-xs text-muted">
        الإجابات تعريفيّة عامّة وليست استشارة قانونيّة أو مهنيّة. المنصّة تُسهّل التواصل ولا تقدّم
        الخدمة بنفسها.
      </p>
    </div>
  );
}
