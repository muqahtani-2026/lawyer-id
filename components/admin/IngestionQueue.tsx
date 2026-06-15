"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { runIngestionNow, importIngested, rejectIngested } from "@/lib/actions/admin-lam";

const CHANNEL_LABEL: Record<string, string> = {
  boe: "هيئة الخبراء",
  umm_alqura: "أم القرى",
  gov_generic: "حكوميّ (gov.sa)",
};

interface Row {
  id: string;
  source_channel: string;
  source_authority: string | null;
  source_url: string;
  title: string | null;
  specialty_id: string | null;
  status: string;
  fetched_at: string;
}
interface Field { id: string; name_ar: string }

export function IngestionQueue({ initial, fields }: { initial: Row[]; fields: Field[] }) {
  const [rows, setRows] = useState(initial);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function runNow() {
    setRunning(true); setMsg("جارٍ الجلب من المصادر الرسميّة…");
    const res = await runIngestionNow();
    setRunning(false);
    setMsg(res.ok ? `تمّ الجلب — أُضيف ${res.inserted ?? 0} عنصرًا جديدًا. حدّث الصفحة لعرضها.` : (res.error ?? "خطأ"));
  }
  async function doImport(id: string) {
    const sp = pick[id];
    if (!sp) { setMsg("اختر التخصّص أوّلًا."); return; }
    setBusy(id); setMsg(null);
    const res = await importIngested(id, sp);
    setBusy(null);
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== id)); setMsg("تمّ الاستيراد إلى الأنظمة ✓"); }
    else setMsg(res.error ?? "خطأ");
  }
  async function doReject(id: string) {
    setBusy(id); setMsg(null);
    const res = await rejectIngested(id);
    setBusy(null);
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== id)); }
    else setMsg(res.error ?? "خطأ");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={runNow} disabled={running} className={buttonClasses("primary", "md")}>
          {running ? "جارٍ الجلب…" : "تشغيل الجلب الآن"}
        </button>
        {msg && <span className="text-sm text-[#8892b0]">{msg}</span>}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#1d3461] bg-[#0f1f3d] p-10 text-center text-[#8892b0]">
          لا عناصر بانتظار المراجعة. اضغط «تشغيل الجلب الآن» لجلب أحدث الأنظمة من المصادر الرسميّة.
        </div>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-4">
            <div className="flex items-center gap-2 text-xs text-[#8892b0]">
              <span className="rounded bg-[#152a4a] px-2 py-0.5">{CHANNEL_LABEL[r.source_channel] ?? r.source_channel}</span>
              {r.source_authority && <span>{r.source_authority}</span>}
            </div>
            <a href={r.source_url} target="_blank" rel="noreferrer" className="mt-1 block font-medium text-[#e6f1ff] hover:text-[#4a9eff]">
              {r.title || r.source_url}
            </a>
            <div className="mt-1 truncate font-mono text-xs text-[#8892b0]" dir="ltr">{r.source_url}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={pick[r.id] ?? ""}
                onChange={(e) => setPick({ ...pick, [r.id]: e.target.value })}
                className="h-9 rounded-lg border border-[#1d3461] bg-[#0a192f] px-2 text-sm text-[#e6f1ff]"
              >
                <option value="">— اختر التخصّص —</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name_ar}</option>
                ))}
              </select>
              <button onClick={() => doImport(r.id)} disabled={busy === r.id} className={buttonClasses("primary", "sm")}>استيراد إلى الأنظمة</button>
              <button onClick={() => doReject(r.id)} disabled={busy === r.id} className={buttonClasses("danger", "sm")}>رفض</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
