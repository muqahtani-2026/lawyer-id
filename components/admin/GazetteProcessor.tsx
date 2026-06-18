"use client";

import { useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  pending: "بانتظار المعالجة",
  parsed: "مُحلّل",
  review: "يحتاج مراجعة",
  needs_ocr: "يحتاج OCR",
  failed: "فشل",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#8892b0",
  parsed: "#4ade80",
  review: "#fbbf24",
  needs_ocr: "#a855f7",
  failed: "#ef4444",
};

type IssueRow = {
  issue_number: number;
  issue_date_hijri: string | null;
  process_status: string;
  events_count: number;
  process_error: string | null;
};

type BatchResult = {
  ok: boolean;
  processed: number;
  remaining: number;
  results: { issue_number: number; status: string; events: number; pending_links: number; error?: string }[];
  error?: string;
};

export function GazetteProcessor({
  initialPending,
  issues,
}: {
  initialPending: number;
  issues: IssueRow[];
}) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(initialPending);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [testNum, setTestNum] = useState("");
  const [testing, setTesting] = useState(false);

  function addLog(line: string) {
    setLog((l) => [line, ...l].slice(0, 40));
  }

  async function processOne() {
    const n = parseInt(testNum, 10);
    if (!Number.isFinite(n)) {
      addLog("أدخل رقم عدد صحيحًا للتجربة.");
      return;
    }
    setTesting(true);
    addLog(`تجربة العدد ${n} (Mistral OCR)…`);
    try {
      const r = await fetch("/api/gazette/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueNumber: n }),
      });
      const res: BatchResult = await r.json();
      if (!res.ok) {
        addLog("خطأ: " + (res.error ?? "غير معروف"));
      } else if (res.results.length === 0) {
        addLog(`العدد ${n}: غير موجود في قاعدة البيانات.`);
      } else {
        for (const item of res.results) {
          const label = STATUS_LABEL[item.status] ?? item.status;
          addLog(
            `العدد ${item.issue_number}: ${label}` +
              (item.events ? ` — ${item.events} حدثًا` : "") +
              (item.pending_links ? ` (${item.pending_links} بانتظار ربط)` : "") +
              (item.error ? ` — ${item.error}` : "")
          );
        }
      }
    } catch (e) {
      addLog("خطأ في الاتصال: " + (e instanceof Error ? e.message : ""));
    }
    setTesting(false);
  }

  async function processAll() {
    setRunning(true);
    setDone(false);
    addLog("بدء المعالجة…");
    let safety = 0;
    while (safety < 200) {
      safety++;
      let res: BatchResult;
      try {
        const r = await fetch("/api/gazette/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 3 }),
        });
        res = await r.json();
      } catch (e) {
        addLog("خطأ في الاتصال — إيقاف. " + (e instanceof Error ? e.message : ""));
        break;
      }
      if (!res.ok) {
        addLog("خطأ: " + (res.error ?? "غير معروف"));
        break;
      }
      for (const item of res.results) {
        const label = STATUS_LABEL[item.status] ?? item.status;
        addLog(
          `العدد ${item.issue_number}: ${label}` +
            (item.events ? ` — ${item.events} حدثًا` : "") +
            (item.pending_links ? ` (${item.pending_links} بانتظار ربط)` : "") +
            (item.error ? ` — ${item.error}` : "")
        );
      }
      setRemaining(res.remaining);
      if (res.remaining === 0 || res.processed === 0) {
        setDone(true);
        addLog("اكتملت المعالجة ✓");
        break;
      }
    }
    setRunning(false);
  }

  return (
    <div className="space-y-5">
      {/* بطاقة تجربة عدد واحد — للاختبار الآمن قبل المعالجة الجماعيّة */}
      <div className="rounded-xl border border-[#4a9eff] bg-[#0f1f3d] p-5">
        <div className="font-semibold text-[#e6f1ff]">تجربة عدد واحد (Mistral OCR)</div>
        <div className="mt-1 text-sm text-[#8892b0]">
          أدخل رقم عدد لإعادة معالجته وحده بمحرّك OCR الجديد — للتحقّق من جودة النصّ قبل التعميم.
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={testNum}
            onChange={(e) => setTestNum(e.target.value)}
            placeholder="مثال: 5111"
            className="w-40 rounded-lg border border-[#1d3461] bg-[#0a192f] px-3 py-2 font-mono text-sm text-[#e6f1ff] placeholder:text-[#8892b0] focus:border-[#4a9eff] focus:outline-none"
          />
          <button
            onClick={processOne}
            disabled={testing || running}
            className="rounded-lg bg-[#4a9eff] px-5 py-2 font-semibold text-[#0a192f] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {testing ? "جارٍ التجربة…" : "جرّب هذا العدد"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-[#e6f1ff]">معالجة آليّة لكلّ الأعداد</div>
            <div className="mt-1 text-sm text-[#8892b0]">
              يستخرج النصّ حرفيًّا من كلّ عدد، يفصل القرارات عن الأخبار، يستنتج الأنظمة، ويربطها برقم المرجع.
              المتبقّي: <span className="font-mono text-[#4a9eff]">{remaining}</span> عددًا.
            </div>
          </div>
          <button
            onClick={processAll}
            disabled={running}
            className="rounded-lg bg-[#fbbf24] px-5 py-2.5 font-semibold text-[#0a192f] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {running ? "جارٍ المعالجة…" : done ? "إعادة التشغيل" : "ابدأ المعالجة"}
          </button>
        </div>

        {log.length > 0 && (
          <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-[#1d3461] bg-[#0a192f] p-3 font-mono text-xs leading-6 text-[#8892b0]">
            {log.map((l, i) => (
              <div key={i} className={i === 0 ? "text-[#e6f1ff]" : ""}>{l}</div>
            ))}
          </div>
        )}
        {running && (
          <div className="mt-2 text-xs text-[#8892b0]">
            لا تُغلق الصفحة أثناء المعالجة. تعمل على دفعات صغيرة حتّى تنتهي تلقائيًّا.
          </div>
        )}
      </div>

      {/* قائمة الأعداد */}
      <div>
        <div className="mb-2 font-mono text-xs text-[#8892b0]">الأعداد ({issues.length})</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {issues.map((it) => {
            const color = STATUS_COLOR[it.process_status] ?? "#8892b0";
            return (
              <div key={it.issue_number} className="rounded-lg border border-[#1d3461] bg-[#0f1f3d] p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#e6f1ff]">{it.issue_number}</span>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} title={STATUS_LABEL[it.process_status]} />
                </div>
                <div className="mt-1 text-[10px]" style={{ color }}>
                  {STATUS_LABEL[it.process_status] ?? it.process_status}
                  {it.events_count > 0 ? ` · ${it.events_count} حدث` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
