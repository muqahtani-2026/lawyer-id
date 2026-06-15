"use client";

import { useState, type ReactNode, type ComponentType } from "react";

type IconProps = { size?: number };

function svgBase(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

const IconBolt = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg>
);
const IconShieldCheck = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
);
const IconUndo = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-1" /></svg>
);
const IconCheck = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><path d="M5 12l5 5L20 7" /></svg>
);
const IconChevron = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><path d="M6 9l6 6 6-6" /></svg>
);
const IconArrowRight = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><path d="M9 6l6 6-6 6" /></svg>
);
const IconKeyboard = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><rect x="3" y="7" width="18" height="11" rx="2" /><path d="M7 11h.01M11 11h.01M15 11h.01M8 15h8" /></svg>
);
const IconClock = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const IconLock = ({ size = 18 }: IconProps) => (
  <svg {...svgBase(size)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

export type ConnectStep = { title: string; detail: string; typeNote: string };

export type ConnectGuideProps = {
  homeHref?: string;
  brandIcon: ReactNode;
  headline: ReactNode;
  valueText: string;
  title: string;
  steps: ConnectStep[];
  connectHref: string;
  ctaLabel: string;
  accent: string;
};

const BENEFITS: { Icon: ComponentType<IconProps>; text: string }[] = [
  { Icon: IconBolt, text: "نشر فوريّ من لوحتك مباشرة." },
  { Icon: IconShieldCheck, text: "لا يُنشَر إلّا ما تعتمده أنت." },
  { Icon: IconUndo, text: "تفصل الحساب متى شئت." },
];

const CSS = `
.cgg-root{min-height:100vh;display:flex;flex-direction:column;background:#0a192f;color:#e6f1ff;direction:rtl;font-family:'IBM Plex Sans Arabic',system-ui,sans-serif}
.cgg-top{display:flex;align-items:center;justify-content:space-between;padding:14px 26px;border-bottom:1px solid #1d3461}
.cgg-brand{display:flex;align-items:center;gap:11px;background:none;border:none;cursor:pointer;padding:4px;border-radius:10px}
.cgg-mark{width:38px;height:38px;border:1.5px solid #4a9eff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;color:#4a9eff;font-weight:600;font-size:15px;flex:none}
.cgg-bname{font-family:'Readex Pro',sans-serif;font-size:14px;font-weight:500;color:#e6f1ff;line-height:1.25}
.cgg-bsub{font-size:10px;letter-spacing:1.5px;color:#8892b0}
.cgg-back{display:flex;align-items:center;gap:6px;background:#0f1f3d;border:1px solid #1d3461;color:#8892b0;border-radius:9px;padding:8px 14px;font-size:13px;cursor:pointer;font-family:inherit;transition:.15s}
.cgg-back:hover{color:#e6f1ff;border-color:#4a9eff}
.cgg-split{flex:1;display:grid;grid-template-columns:1fr 1fr;max-width:1180px;width:calc(100% - 48px);margin:28px auto;border:1px solid #1d3461;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.32)}
.cgg-hero{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:52px;border-left:1px solid #1d3461;background:radial-gradient(circle at 88% 14%,rgba(74,158,255,.16),transparent 52%),#0d1d38}
.cgg-watermark{position:absolute;left:-30px;bottom:-55px;z-index:0;color:rgba(74,158,255,.05);pointer-events:none;line-height:1}
.cgg-watermark svg{width:240px;height:240px;display:block}
.cgg-hero-inner{position:relative;z-index:1;max-width:420px}
.cgg-eyebrow{display:inline-flex;align-items:center;gap:7px;background:#152a4a;border:1px solid #234268;color:#9cc4f5;font-size:12px;padding:5px 13px;border-radius:999px;margin-bottom:24px}
.cgg-h1{font-family:'Readex Pro',sans-serif;font-size:29px;line-height:1.45;font-weight:600;margin:0 0 16px;color:#e6f1ff}
.cgg-sub{font-size:14px;line-height:1.9;color:#8892b0;margin:0 0 32px;max-width:390px}
.cgg-bullets{display:flex;flex-direction:column;gap:16px}
.cgg-bullet{display:flex;align-items:center;gap:12px}
.cgg-bic{flex:none;width:34px;height:34px;border-radius:10px;background:#152a4a;border:1px solid #234268;display:flex;align-items:center;justify-content:center}
.cgg-btext{font-size:13.5px;color:#dbe7fb}
.cgg-action{display:flex;align-items:center;justify-content:center;padding:48px 40px;background:#0f1f3d}
.cgg-card{width:100%;max-width:400px}
.cgg-iconw{width:54px;height:54px;border-radius:15px;background:#152a4a;border:1px solid #234268;display:flex;align-items:center;justify-content:center;margin:0 auto 13px}
.cgg-title{font-family:'Readex Pro',sans-serif;font-size:19px;font-weight:500;text-align:center;margin:0 0 10px}
.cgg-time{display:flex;width:fit-content;margin:0 auto 22px;align-items:center;gap:6px;border:1px solid #1d3461;color:#8892b0;font-size:11.5px;padding:4px 12px;border-radius:999px}
.cgg-steps{position:relative;margin-bottom:22px}
.cgg-rail{position:absolute;right:14px;top:15px;bottom:15px;width:2px;background:#1d3461}
.cgg-step{position:relative;display:flex;gap:13px}
.cgg-step.pb{padding-bottom:15px}
.cgg-node{position:relative;z-index:1;flex:none;width:30px;height:30px;border-radius:50%;background:#0f1f3d;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:500;border:1px solid}
.cgg-node.done{background:#10331f;border-color:#4ade80;color:#4ade80}
.cgg-shead{display:flex;width:100%;align-items:center;gap:12px;min-height:30px;background:none;border:none;padding:0;cursor:pointer;color:inherit;font-family:inherit;text-align:right}
.cgg-stitle{flex:1;font-size:14px;font-weight:500}
.cgg-chev{color:#8892b0;transition:transform .2s;flex:none}
.cgg-chev.up{transform:rotate(180deg)}
.cgg-sbody{padding-top:9px;font-size:12.5px;line-height:1.75;color:#8892b0}
.cgg-sbody p{margin:0 0 9px}
.cgg-type{display:flex;align-items:flex-start;gap:8px;background:#0a192f;border:1px solid #1d3461;border-radius:10px;padding:9px 11px}
.cgg-type b{color:#e6f1ff;font-weight:500}
.cgg-cta{width:100%;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:600;font-family:inherit;color:#0a192f;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;transition:opacity .15s}
.cgg-cta:hover{opacity:.9}
.cgg-foot{display:flex;align-items:center;gap:6px;justify-content:center;margin-top:13px;color:#8892b0;font-size:11.5px}
@media (max-width:900px){
.cgg-split{grid-template-columns:1fr;max-width:480px;width:calc(100% - 32px)}
.cgg-hero{padding:34px 26px;border-left:none;border-bottom:1px solid #1d3461}
.cgg-h1{font-size:23px}
.cgg-watermark svg{width:170px;height:170px}
.cgg-action{padding:32px 24px}
}
`;

export default function ConnectGuide({
  homeHref = "/",
  brandIcon,
  headline,
  valueText,
  title,
  steps,
  connectHref,
  ctaLabel,
  accent,
}: ConnectGuideProps) {
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="cgg-root">
      <style>{CSS}</style>

      <header className="cgg-top">
        <button type="button" className="cgg-brand" onClick={() => { window.location.href = homeHref; }}>
          <span className="cgg-mark">لام</span>
          <span>
            <span className="cgg-bname" style={{ display: "block" }}>لام</span>
            <span className="cgg-bsub">SAUDI · LEGAL</span>
          </span>
        </button>
        <button type="button" className="cgg-back" onClick={() => { window.history.back(); }}>
          <IconArrowRight size={16} />
          العودة
        </button>
      </header>

      <div className="cgg-split">
        <section className="cgg-hero">
          <div className="cgg-watermark" aria-hidden>{brandIcon}</div>
          <div className="cgg-hero-inner">
            <span className="cgg-eyebrow" style={{ color: accent }}>
              <IconBolt size={14} /> نشر تلقائيّ بضغطة واحدة
            </span>
            <h1 className="cgg-h1">{headline}</h1>
            <p className="cgg-sub">{valueText}</p>
            <div className="cgg-bullets">
              {BENEFITS.map(({ Icon, text }) => (
                <div key={text} className="cgg-bullet">
                  <span className="cgg-bic" style={{ color: accent }}><Icon size={17} /></span>
                  <span className="cgg-btext">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cgg-action">
          <div className="cgg-card">
            <div className="cgg-iconw" style={{ color: accent }}>{brandIcon}</div>
            <h2 className="cgg-title">{title}</h2>
            <div className="cgg-time"><IconClock size={13} /> أقلّ من دقيقتين</div>

            <div className="cgg-steps">
              <span className="cgg-rail" />
              {steps.map((step, i) => {
                const isOpen = open === i;
                const isLast = i === steps.length - 1;
                return (
                  <div key={step.title} className={`cgg-step${isLast ? "" : " pb"}`}>
                    <span
                      className={`cgg-node${isLast ? " done" : ""}`}
                      style={isLast ? undefined : { borderColor: accent, color: accent }}
                    >
                      {isLast ? <IconCheck size={16} /> : i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <button
                        type="button"
                        className="cgg-shead"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? -1 : i)}
                      >
                        <span className="cgg-stitle">{step.title}</span>
                        <span className={`cgg-chev${isOpen ? " up" : ""}`}><IconChevron size={18} /></span>
                      </button>
                      {isOpen && (
                        <div className="cgg-sbody">
                          <p>{step.detail}</p>
                          <div className="cgg-type">
                            <span style={{ color: accent, flex: "none", marginTop: 1 }}><IconKeyboard size={15} /></span>
                            <span><b>ماذا تكتب؟ </b>{step.typeNote}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" className="cgg-cta" style={{ background: accent }} onClick={() => { window.location.href = connectHref; }}>
              <span aria-hidden>{brandIcon}</span>
              {ctaLabel}
            </button>

            <div className="cgg-foot"><IconLock size={14} /> بياناتك مشفّرة ومحفوظة بأمان.</div>
          </div>
        </section>
      </div>
    </div>
  );
}