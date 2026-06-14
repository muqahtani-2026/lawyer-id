"use client";

import { useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  publishDraftAsArticle,
  setArticleStatus,
  updateLeadStatus,
  submitAnswer,
} from "@/lib/actions/me";

const articleStatusTone: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  published: "success",
  unpublished: "neutral",
  rejected: "danger",
};
const articleStatusLabel: Record<string, string> = {
  draft: "مسودّة",
  pending: "بانتظار الإشراف",
  published: "منشور",
  unpublished: "غير منشور",
  rejected: "مرفوض",
};

export function PublishDraftButton({ draftId }: { draftId: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return <Badge tone="warning">أُرسل للإشراف</Badge>;
  return (
    <button
      disabled={pending}
      onClick={() => start(async () => { const r = await publishDraftAsArticle(draftId); if (r.ok) setDone(true); })}
      className={buttonClasses("primary", "sm")}
    >
      {pending ? "…" : "نشر كمقال"}
    </button>
  );
}

export function ArticleStatusControl({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(status);
  return (
    <div className="flex items-center gap-2">
      <Badge tone={articleStatusTone[cur] ?? "neutral"}>{articleStatusLabel[cur] ?? cur}</Badge>
      {cur === "published" && (
        <button
          disabled={pending}
          onClick={() => start(async () => { const r = await setArticleStatus(id, "unpublished"); if (r.ok) setCur("unpublished"); })}
          className={buttonClasses("ghost", "sm")}
        >
          إلغاء النشر
        </button>
      )}
    </div>
  );
}

const leadStatusLabel: Record<string, string> = { new: "جديد", seen: "تمّت المشاهدة", handled: "تمّت المتابعة" };

export function LeadStatusControl({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(status);
  const next = cur === "new" ? "seen" : cur === "seen" ? "handled" : null;
  return (
    <div className="flex items-center gap-2">
      <Badge tone={cur === "new" ? "warning" : cur === "handled" ? "success" : "neutral"}>
        {leadStatusLabel[cur]}
      </Badge>
      {next && (
        <button
          disabled={pending}
          onClick={() => start(async () => { const r = await updateLeadStatus(id, next as "seen" | "handled"); if (r.ok) setCur(next); })}
          className={buttonClasses("ghost", "sm")}
        >
          {next === "seen" ? "وضع كمقروء" : "وضع كمتابَع"}
        </button>
      )}
    </div>
  );
}

export function AnswerForm({ questionId, answered }: { questionId: string; answered?: string }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");
  const [state, setState] = useState<string | null>(answered ?? null);

  if (state) {
    const label = state === "published" ? "إجابتك منشورة" : state === "submitted" ? "إجابتك بانتظار الإشراف" : `إجابتك: ${state}`;
    return <Badge tone={state === "published" ? "success" : "warning"}>{label}</Badge>;
  }

  return (
    <div className="space-y-2">
      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="اكتب ردًّا تعريفيًّا عامًّا (سيُراجَع قبل النشر)…"
        className="w-full rounded-lg border border-line bg-base px-3 py-2 text-sm text-content placeholder:text-muted focus:border-lawyer focus:outline-none"
      />
      <button
        disabled={pending || body.trim().length < 10}
        onClick={() => start(async () => { const r = await submitAnswer(questionId, body); if (r.ok) setState("submitted"); })}
        className={buttonClasses("primary", "sm")}
      >
        {pending ? "جارٍ الإرسال…" : "إرسال الردّ"}
      </button>
    </div>
  );
}
