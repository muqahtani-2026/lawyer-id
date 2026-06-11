"use client";

import { useMemo, useState, useTransition } from "react";
import { bulkScheduleDrafts, type BulkItem } from "@/lib/actions/schedule";

type DraftRow = {
  id: string;
  title: string;
  content: string;
  scheduled_for: string | null;
};

type Props = {
  preferredHour: number;
  initialDrafts: DraftRow[];
};

/* ----------------------- أدوات الوقت (توقيت الرياض) ----------------------- */
// الرياض = UTC+3 ثابتًا (لا توقيت صيفيّ في السعودية).
const RIYADH_OFFSET_MIN = 3 * 60;

// يحوّل (تاريخ محليّ بالرياض yyyy-mm-dd + ساعة + دقيقة) إلى ISO UTC.
function riyadhToUtcIso(dateStr: string, hour: number, minute: number): string {
  // dateStr يمثّل يومًا بتوقيت الرياض. ننشئ لحظة UTC تقابل ذلك الوقت المحليّ.
  const [y, m, d] = dateStr.split("-").map(Number);
  const utcMs = Date.UTC(y, m - 1, d, hour, minute) - RIYADH_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs).toISOString();
}

// من ISO UTC إلى أجزاء الرياض (للعرض في الحقول).
function utcIsoToRiyadhParts(iso: string): { date: string; hour: number; minute: number } {
  const t = new Date(iso).getTime() + RIYADH_OFFSET_MIN * 60 * 1000;
  const d = new Date(t);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
  return { date: date, hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

// تاريخ الغد بتوقيت الرياض كـ yyyy-mm-dd.
function riyadhTodayPlus(days: number): string {
  const nowR = new Date(Date.now() + RIYADH_OFFSET_MIN * 60 * 1000);
  nowR.setUTCDate(nowR.getUTCDate() + days);
  return `${nowR.getUTCFullYear()}-${String(nowR.getUTCMonth() + 1).padStart(2, "0")}-${String(
    nowR.getUTCDate(),
  ).padStart(2, "0")}`;
}

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function prettyRiyadh(dateStr: string, hour: number, minute: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${WEEKDAYS[wd]} ${d} ${MONTHS[m - 1]} ${y} — ${hh}:${mm}`;
}

/* --------------------------------- المكوّن --------------------------------- */

type PlanRow = DraftRow & { date: string; hour: number; minute: number };

export default function SchedulePlanner({ preferredHour, initialDrafts }: Props) {
  // الحالة الأوليّة: المجدوَل يأخذ وقته؛ غير المجدوَل يأخذ توزيعًا تلقائيًّا.
  const buildInitial = (): PlanRow[] =>
    initialDrafts.map((d, i) => {
      if (d.scheduled_for) {
        const p = utcIsoToRiyadhParts(d.scheduled_for);
        return { ...d, date: p.date, hour: p.hour, minute: p.minute };
      }
      // توزيع تلقائيّ: من الغد، يومًا بيوم، في ساعة التسجيل، دقيقة 0.
      return { ...d, date: riyadhTodayPlus(i + 1), hour: preferredHour, minute: 0 };
    });

  const [rows, setRows] = useState<PlanRow[]>(buildInitial);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // إعادة توزيع تلقائيّ على الكلّ (يتجاهل التعديلات اليدويّة).
  function autoDistribute() {
    setRows((prev) =>
      prev.map((r, i) => ({ ...r, date: riyadhTodayPlus(i + 1), hour: preferredHour, minute: 0 })),
    );
    setMsg(null);
  }

  function update(id: string, patch: Partial<Pick<PlanRow, "date" | "hour" | "minute">>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setMsg(null);
  }

  // تحقّق محليّ: داخل 30 يومًا، مستقبليّ، لا تكرار وقت.
  const validation = useMemo(() => {
    const now = Date.now();
    const maxMs = now + 30 * 24 * 60 * 60 * 1000;
    const minuteKeys = new Map<number, number>(); // minuteKey -> count
    const issues: Record<string, string> = {};
    for (const r of rows) {
      const iso = riyadhToUtcIso(r.date, r.hour, r.minute);
      const t = new Date(iso).getTime();
      if (t < now + 60 * 1000) issues[r.id] = "الوقت يجب أن يكون مستقبليًّا";
      else if (t > maxMs) issues[r.id] = "خارج حدّ 30 يومًا";
      const key = Math.floor(t / (60 * 1000));
      minuteKeys.set(key, (minuteKeys.get(key) ?? 0) + 1);
    }
    // علّم التكرارات
    for (const r of rows) {
      const iso = riyadhToUtcIso(r.date, r.hour, r.minute);
      const key = Math.floor(new Date(iso).getTime() / (60 * 1000));
      if ((minuteKeys.get(key) ?? 0) > 1 && !issues[r.id]) {
        issues[r.id] = "وقت مكرّر — غيّر الدقيقة أو الساعة";
      }
    }
    return { issues, valid: Object.keys(issues).length === 0 };
  }, [rows]);

  function approveAll() {
    if (!validation.valid) {
      setMsg({ kind: "err", text: "صحّح الأوقات المعلّمة بالأحمر أوّلًا." });
      return;
    }
    const items: BulkItem[] = rows.map((r) => ({
      draftId: r.id,
      isoUtc: riyadhToUtcIso(r.date, r.hour, r.minute),
    }));
    startTransition(async () => {
      const res = await bulkScheduleDrafts(items);
      if (res.ok) {
        setMsg({ kind: "ok", text: "تمّ اعتماد الجدول. ستُنشَر المسوّدات تلقائيًّا في أوقاتها." });
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  const hourOptions = Array.from({ length: 24 }, (_, h) => h);
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="planner-wrap">
      <style>{`
        .planner-wrap{padding:24px;max-width:980px;margin:0 auto;color:#e6f1ff;direction:rtl}
        .planner-head h1{font-family:'Readex Pro',system-ui,sans-serif;font-size:28px;font-weight:700;margin:0 0 4px}
        .planner-head p{font-size:13px;color:#8892b0;margin:0}
        .toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:18px 0}
        .btn{border:none;cursor:pointer;border-radius:8px;font-size:14px;font-weight:600;padding:10px 16px;font-family:inherit;transition:background .15s}
        .btn-primary{background:#a855f7;color:#fff}
        .btn-primary:hover{background:#9333ea}
        .btn-primary:disabled{opacity:.5;cursor:default}
        .btn-ghost{background:#152a4a;color:#cde3ff}
        .btn-ghost:hover{background:#1d3461}
        .count{font-size:13px;color:#8892b0;margin-inline-start:auto}
        .empty{background:#0f1f3d;border:1px solid #1d3461;border-radius:10px;padding:48px 24px;text-align:center}
        .empty h3{font-size:16px;margin:0 0 8px}
        .empty p{font-size:13px;color:#8892b0;max-width:460px;margin:0 auto}
        table{width:100%;border-collapse:separate;border-spacing:0 8px}
        th{font-size:12px;color:#8892b0;font-weight:600;text-align:right;padding:0 10px}
        td{background:#0f1f3d;border-top:1px solid #1d3461;border-bottom:1px solid #1d3461;padding:12px 10px;vertical-align:middle}
        td:first-child{border-right:1px solid #1d3461;border-top-right-radius:10px;border-bottom-right-radius:10px}
        td:last-child{border-left:1px solid #1d3461;border-top-left-radius:10px;border-bottom-left-radius:10px}
        tr.bad td{border-color:#ef4444}
        .idx{display:inline-flex;width:26px;height:26px;border-radius:50%;background:#152a4a;color:#4a9eff;font-size:12px;align-items:center;justify-content:center;font-weight:700}
        .title{font-size:14px;font-weight:600;line-height:1.4;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .preview{font-size:12px;color:#8892b0;line-height:1.5;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}
        input[type=date],select{background:#0a192f;border:1px solid #1d3461;color:#e6f1ff;border-radius:7px;padding:7px 8px;font-size:13px;font-family:inherit}
        input[type=date]{color-scheme:dark}
        .time-cell{display:flex;gap:6px;align-items:center}
        .pretty{font-size:11px;color:#8892b0;margin-top:4px}
        .row-err{font-size:11px;color:#ef4444;margin-top:4px}
        .banner{border-radius:8px;padding:12px 14px;font-size:13px;margin:14px 0}
        .banner.ok{background:rgba(74,222,128,.12);color:#4ade80;border:1px solid rgba(74,222,128,.35)}
        .banner.err{background:rgba(239,68,68,.12);color:#fca5a5;border:1px solid rgba(239,68,68,.35)}
        .note{font-size:12px;color:#8892b0;margin-top:6px;line-height:1.6}
      `}</style>

      <header className="planner-head">
        <h1>مخطّط النشر — 30 يومًا</h1>
        <p>وزّع مسوّداتك على X خلال 30 يومًا القادمة. التوزيع التلقائيّ يبدأ من الغد في ساعة {String(preferredHour).padStart(2, "0")}:00 (توقيت الرياض).</p>
      </header>

      {rows.length === 0 ? (
        <div className="empty">
          <h3>لا مسوّدات جاهزة للجدولة</h3>
          <p>تظهر هنا مسوّدات X القصيرة المقبولة. وافِق على مسوّداتك من صفحة المراجعة، ثمّ ارجع لجدولتها.</p>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <button className="btn btn-ghost" onClick={autoDistribute} disabled={pending}>
              توزيع تلقائيّ
            </button>
            <button className="btn btn-primary" onClick={approveAll} disabled={pending || !validation.valid}>
              {pending ? "جارٍ الحفظ…" : "اعتمد الجدول وانشر تلقائيًّا"}
            </button>
            <span className="count">{rows.length} مسوّدة</span>
          </div>

          {msg && <div className={`banner ${msg.kind}`}>{msg.text}</div>}

          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>المسوّدة</th>
                <th style={{ width: 150 }}>التاريخ</th>
                <th style={{ width: 170 }}>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const err = validation.issues[r.id];
                return (
                  <tr key={r.id} className={err ? "bad" : ""}>
                    <td><span className="idx">{i + 1}</span></td>
                    <td>
                      <div className="title">{r.title}</div>
                      <div className="preview">{r.content}</div>
                    </td>
                    <td>
                      <input
                        type="date"
                        value={r.date}
                        min={riyadhTodayPlus(0)}
                        max={riyadhTodayPlus(30)}
                        onChange={(e) => update(r.id, { date: e.target.value })}
                      />
                    </td>
                    <td>
                      <div className="time-cell">
                        <select value={r.hour} onChange={(e) => update(r.id, { hour: Number(e.target.value) })}>
                          {hourOptions.map((h) => (
                            <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                          ))}
                        </select>
                        <span>:</span>
                        <select value={r.minute} onChange={(e) => update(r.id, { minute: Number(e.target.value) })}>
                          {minuteOptions.map((m) => (
                            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                          ))}
                        </select>
                      </div>
                      {err ? (
                        <div className="row-err">{err}</div>
                      ) : (
                        <div className="pretty">{prettyRiyadh(r.date, r.hour, r.minute)}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="note">
            • السقف 30 يومًا من اليوم. • يمكن وضع أكثر من مسوّدة في اليوم نفسه بشرط اختلاف الوقت. •
            بعد الاعتماد تُنشَر كلّ مسوّدة تلقائيًّا في وقتها على حسابك في X.
          </p>
        </>
      )}
    </div>
  );
}
