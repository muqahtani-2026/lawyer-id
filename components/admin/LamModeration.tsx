"use client";

import { useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { moderateArticle, moderateQuestion, moderateAnswer } from "@/lib/actions/admin-lam";

const articleTone: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral", pending: "warning", published: "success", unpublished: "neutral", rejected: "danger",
};
const articleLabel: Record<string, string> = {
  draft: "مسودّة", pending: "بانتظار", published: "منشور", unpublished: "غير منشور", rejected: "مرفوض",
};

export function ArticleModeration({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(status);
  const act = (a: "publish" | "reject" | "unpublish", next: string) =>
    start(async () => { const r = await moderateArticle(id, a); if (r.ok) setCur(next); });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={articleTone[cur] ?? "neutral"}>{articleLabel[cur] ?? cur}</Badge>
      {cur !== "published" && (
        <button disabled={pending} onClick={() => act("publish", "published")} className={buttonClasses("primary", "sm")}>نشر</button>
      )}
      {cur === "published" && (
        <button disabled={pending} onClick={() => act("unpublish", "unpublished")} className={buttonClasses("ghost", "sm")}>إلغاء النشر</button>
      )}
      {cur !== "rejected" && (
        <button disabled={pending} onClick={() => act("reject", "rejected")} className={buttonClasses("danger", "sm")}>رفض</button>
      )}
    </div>
  );
}

const qTone: Record<string, "neutral" | "warning" | "success" | "danger"> = {
  pending: "warning", approved: "neutral", answered: "neutral", published: "success", rejected: "danger",
};
const qLabel: Record<string, string> = {
  pending: "بانتظار", approved: "معتمَد", answered: "أُجيب", published: "منشور", rejected: "مرفوض",
};

export function QuestionModeration({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(status);
  const act = (a: "approve" | "reject" | "publish", next: string) =>
    start(async () => { const r = await moderateQuestion(id, a); if (r.ok) setCur(next); });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={qTone[cur] ?? "neutral"}>{qLabel[cur] ?? cur}</Badge>
      {cur === "pending" && (
        <button disabled={pending} onClick={() => act("approve", "approved")} className={buttonClasses("primary", "sm")}>اعتماد للإجابة</button>
      )}
      {cur !== "published" && cur !== "rejected" && (
        <button disabled={pending} onClick={() => act("publish", "published")} className={buttonClasses("outline", "sm")}>نشر</button>
      )}
      {cur !== "rejected" && (
        <button disabled={pending} onClick={() => act("reject", "rejected")} className={buttonClasses("danger", "sm")}>رفض</button>
      )}
    </div>
  );
}

const aLabel: Record<string, string> = {
  submitted: "بانتظار", approved: "معتمَد", published: "منشور", rejected: "مرفوض",
};

export function AnswerModeration({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [cur, setCur] = useState(status);
  const act = (a: "approve" | "publish" | "reject", next: string) =>
    start(async () => { const r = await moderateAnswer(id, a); if (r.ok) setCur(next); });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={cur === "published" ? "success" : cur === "rejected" ? "danger" : "warning"}>
        {aLabel[cur] ?? cur}
      </Badge>
      {cur !== "published" && (
        <button disabled={pending} onClick={() => act("publish", "published")} className={buttonClasses("primary", "sm")}>نشر الإجابة</button>
      )}
      {cur !== "rejected" && (
        <button disabled={pending} onClick={() => act("reject", "rejected")} className={buttonClasses("danger", "sm")}>رفض</button>
      )}
    </div>
  );
}
