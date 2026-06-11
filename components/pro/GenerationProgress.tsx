"use client";

import { useEffect, useRef, useState } from "react";

/**
 * عدّاد تفاعليّ لتوليد مسوّدات Pro (30).
 * يستعلم /api/pro/generation-status كلّ 3 ثوانٍ، يعرض رقمًا متصاعدًا + نسبة مئويّة،
 * ويتوقّف عند الاكتمال.
 */

type Status = { count: number; target: number; done: boolean };

export default function GenerationProgress() {
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState(30);
  const [done, setDone] = useState(false);
  const [stalled, setStalled] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const res = await fetch("/api/pro/generation-status", { cache: "no-store" });
        if (!res.ok) return;
        const s: Status = await res.json();
        if (!active) return;
        setCount(s.count);
        setTarget(s.target);
        if (s.done) {
          setDone(true);
          if (timer.current) clearInterval(timer.current);
        }
        // إن مرّت 90 ثانية دون أيّ مسوّدة، أظهر طمأنة إضافيّة.
        if (s.count === 0 && Date.now() - startedAt.current > 90_000) {
          setStalled(true);
        }
      } catch {
        /* تجاهل أخطاء الشبكة المؤقّتة */
      }
    }

    poll();
    timer.current = setInterval(poll, 3000);
    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const pct = Math.round((count / target) * 100);

  return (
    <div className="genwrap">
      <style>{`
        .genwrap{direction:rtl;max-width:520px;margin:0 auto;color:#e6f1ff;font-family:'IBM Plex Sans Arabic',system-ui,sans-serif}
        .card{background:#0f1f3d;border:1px solid #1d3461;border-radius:14px;padding:28px 24px;text-align:center}
        .badge{display:inline-block;font-size:11px;font-weight:700;color:#a855f7;background:rgba(168,85,247,.12);border:1px solid rgba(168,85,247,.35);border-radius:999px;padding:4px 12px;font-family:'JetBrains Mono',monospace;margin-bottom:14px}
        h2{font-family:'Readex Pro',system-ui,sans-serif;font-size:22px;margin:0 0 6px}
        .sub{font-size:13px;color:#8892b0;margin:0 0 20px;line-height:1.7}
        .num{font-family:'JetBrains Mono',monospace;font-size:48px;font-weight:700;color:#4a9eff;line-height:1;transition:color .3s}
        .num.done{color:#4ade80}
        .slash{font-size:24px;color:#8892b0;margin:0 6px}
        .bar{height:10px;background:#0a192f;border:1px solid #1d3461;border-radius:999px;overflow:hidden;margin:20px 0 8px}
        .fill{height:100%;background:linear-gradient(90deg,#4a9eff,#a855f7);border-radius:999px;transition:width .6s ease}
        .fill.done{background:#4ade80}
        .pct{font-size:12px;color:#8892b0;font-family:'JetBrains Mono',monospace}
        .msg{font-size:13px;margin-top:18px;line-height:1.7}
        .msg.run{color:#8892b0}
        .msg.ok{color:#4ade80}
        .dots::after{content:'';animation:dots 1.4s steps(4,end) infinite}
        @keyframes dots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}}
        .btn{display:inline-block;border:none;cursor:pointer;margin-top:18px;background:#4a9eff;color:#fff;font-size:14px;font-weight:600;padding:11px 22px;border-radius:9px;font-family:inherit;transition:background .15s}
        .btn:hover{background:#3a8eef}
        .spin{display:inline-block;width:14px;height:14px;border:2px solid #4a9eff;border-top-color:transparent;border-radius:50%;animation:sp .8s linear infinite;vertical-align:-2px;margin-inline-start:6px}
        @keyframes sp{to{transform:rotate(360deg)}}
      `}</style>

      <div className="card">
        <span className="badge">Pro</span>

        {!done ? (
          <>
            <h2>نُجهّز محتواك الآن</h2>
            <p className="sub">
              نولّد لك 30 مسوّدة بأسلوبك. تظهر تباعًا — لا حاجة للانتظار في هذه الصفحة،
              يمكنك المتابعة وستجدها في المراجعة.
            </p>
            <div>
              <span className="num">{count}</span>
              <span className="slash">/</span>
              <span className="num" style={{ fontSize: 28, color: "#8892b0" }}>{target}</span>
            </div>
            <div className="bar">
              <div className="fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="pct">{pct}%</div>
            <p className="msg run">
              {stalled
                ? "التوليد قيد التشغيل، قد يستغرق دقائق قليلة"
                : "جارٍ توليد المسوّدات"}
              <span className="dots" />
              <span className="spin" />
            </p>
          </>
        ) : (
          <>
            <h2>اكتمل تجهيز محتواك 🎉</h2>
            <p className="sub">جاهزة لك 30 مسوّدة. راجِعها واعتمدها، ثمّ وزّعها على 30 يومًا من صفحة الجدول.</p>
            <div>
              <span className="num done">{count}</span>
              <span className="slash">/</span>
              <span className="num done" style={{ fontSize: 28 }}>{target}</span>
            </div>
            <div className="bar">
              <div className="fill done" style={{ width: "100%" }} />
            </div>
            <div className="pct">100%</div>
            <p className="msg ok">كلّ المسوّدات جاهزة.</p>
            <button className="btn" onClick={() => { window.location.href = "/review"; }}>
              اذهب إلى المراجعة
            </button>
          </>
        )}
      </div>
    </div>
  );
}
