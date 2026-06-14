import Link from "next/link";
import { AskForm } from "@/components/public/AskForm";
import { getActiveFields, getPublishedQuestions } from "@/lib/queries/public";

export const metadata = { title: "اسأل مختصًّا" };
export const revalidate = 60;

export default async function AskPage() {
  const [fields, questions] = await Promise.all([
    getActiveFields(),
    getPublishedQuestions(20),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-content">اسأل مختصًّا</h1>
      <p className="mt-1 text-muted">اطرح سؤالًا عامًّا، ويجيب عليه أحد المختصّين بعد المراجعة.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <AskForm fields={fields.map((f) => ({ id: f.id, name_ar: f.name_ar }))} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-content">أسئلة أُجيب عنها</h2>
          {questions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">لا أسئلة منشورة بعد.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {questions.map((q) => (
                <Link
                  key={q.id}
                  href={`/ask/${q.id}`}
                  className="block rounded-xl border border-line bg-card p-4 transition-colors hover:border-lawyer"
                >
                  <div className="font-medium text-content">{q.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{q.body}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
