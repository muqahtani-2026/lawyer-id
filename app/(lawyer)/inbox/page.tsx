import { getMyInbox } from "@/lib/queries/me";
import { AnswerForm } from "@/components/dashboard/MeControls";

export const metadata = { title: "اسأل مختصًّا" };

export default async function InboxPage() {
  const { questions, myAnswers } = await getMyInbox();

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-bold text-content">صندوق «اسأل مختصًّا»</h1>
      <p className="mt-1 text-sm text-muted">
        أسئلة عامّة في مجالك بانتظار إجابتك. (ميزة Premium — تُراجَع الإجابة قبل نشرها باسمك.)
      </p>

      {questions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line bg-card p-10 text-center text-muted">
          لا أسئلة في مجالك حاليًّا.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((q) => {
            const id = q.id as string;
            return (
              <div key={id} className="rounded-xl border border-line bg-card p-5">
                <div className="font-medium text-content">{q.title as string}</div>
                <p className="mt-1 text-sm text-muted">{q.body as string}</p>
                <div className="mt-3">
                  <AnswerForm questionId={id} answered={myAnswers[id]} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
