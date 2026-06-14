import { getQuestionsForModeration } from "@/lib/queries/admin-lam";
import { QuestionModeration, AnswerModeration } from "@/components/admin/LamModeration";

export const metadata = { title: "الأسئلة والأجوبة" };

export default async function AdminQuestionsPage() {
  const questions = await getQuestionsForModeration();

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">الأسئلة والأجوبة</h1>
      <p className="mt-1 text-sm text-muted">اعتمد الأسئلة لتوجيهها للمختصّين، وراجع الأجوبة قبل نشرها.</p>

      {questions.length === 0 ? (
        <p className="mt-6 text-muted">لا أسئلة بعد.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((q) => {
            const answers = (q.answers as Array<Record<string, unknown>>) ?? [];
            return (
              <div key={q.id as string} className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-content">{q.title as string}</div>
                    <p className="mt-1 text-sm text-muted">{q.body as string}</p>
                  </div>
                  <QuestionModeration id={q.id as string} status={q.status as string} />
                </div>

                {answers.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-line pt-3">
                    <div className="text-xs font-medium text-muted">الأجوبة المقدّمة</div>
                    {answers.map((a) => (
                      <div key={a.id as string} className="rounded-lg border border-line bg-base p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-muted">بقلم {a.author_name as string}</span>
                          <AnswerModeration id={a.id as string} status={a.status as string} />
                        </div>
                        <p className="mt-2 text-sm text-content/90">{a.body as string}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
