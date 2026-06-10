"use client";

import { useState, useTransition } from "react";
import { publishDraftToX, type PublishResult } from "@/lib/actions/x-publish";

/**
 * زرّ "وافق وانشر إلى X" — يوضع في صفحة /review بجانب كلّ مسوّدة.
 * يظهر فقط لطبقة Pro (مرِّر isPro من مكوّن الخادم).
 */

type Props = {
  draftId: string;
  isPro: boolean;
};

export default function PublishToXButton({ draftId, isPro }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PublishResult | null>(null);

  if (!isPro) return null;

  const onPublish = () => {
    setResult(null);
    startTransition(async () => {
      const r = await publishDraftToX(draftId);
      setResult(r);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onPublish}
        disabled={pending}
        className="rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
        style={{
          background: "var(--accent-lawyer, #4a9eff)",
          color: "#0a192f",
        }}
      >
        {pending ? "جارٍ النشر…" : "وافق وانشر إلى X"}
      </button>

      {result?.ok === true && (
        <a
          href={`https://x.com/i/web/status/${result.tweetId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm"
          style={{ color: "var(--success, #4ade80)" }}
        >
          ✓ نُشِرت — عرض التغريدة
        </a>
      )}
      {result?.ok === false && (
        <span className="text-sm" style={{ color: "var(--danger, #ef4444)" }}>
          {result.error}
        </span>
      )}
    </div>
  );
}
