"use client";

import { useState, type ReactNode, type ComponentType } from "react";

type IconProps = { className?: string };

function IconLock({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconShieldCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconUndo({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-1" />
    </svg>
  );
}

function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function IconChevron({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function IconKeyboard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="11" rx="2" />
      <path d="M7 11h.01M11 11h.01M15 11h.01M8 15h8" />
    </svg>
  );
}

export type ConnectStep = {
  title: string;
  detail: string;
  typeNote: string;
};

export type ConnectGuideProps = {
  /** عنوان الصفحة، مثل: "ربط حساب X" */
  title: string;
  /** سطر تعريفيّ تحت العنوان */
  intro: string;
  /** خطوات الإرشاد (4 عادةً) */
  steps: ConnectStep[];
  /** المسار الذي يبدأ OAuth فعليًّا (زرّ الـ CTA يتوجّه إليه) */
  connectHref: string;
  /** نصّ زرّ الربط، مثل: "ربط حساب X الآن" */
  ctaLabel: string;
  /** لون التمييز: X = #4a9eff · LinkedIn = #0a66c2 */
  accent: string;
  /** أيقونة المنصّة (SVG يرث اللون عبر currentColor) */
  brandIcon: ReactNode;
};

const REASSURANCES: { Icon: ComponentType<IconProps>; text: string }[] = [
  { Icon: IconLock, text: "لا نرى كلمة سرّك" },
  { Icon: IconShieldCheck, text: "تنشر ما توافق عليه فقط" },
  { Icon: IconUndo, text: "تلغي الربط متى شئت" },
];

export default function ConnectGuide({
  title,
  intro,
  steps,
  connectHref,
  ctaLabel,
  accent,
  brandIcon,
}: ConnectGuideProps) {
  const [open, setOpen] = useState<number>(0);

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-start justify-center bg-[#0a192f] px-4 py-10 text-[#e6f1ff]"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#1d3461] bg-[#0a192f] p-6">
        {/* الترويسة */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] border-[#4a9eff] font-medium text-[#4a9eff]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            >
              Li
            </div>
            <div>
              <div className="text-sm font-medium">Lawyer ID</div>
              <div className="text-[11px] text-[#8892b0]">saudi · legal · commercial</div>
            </div>
          </div>
          <span className="rounded-lg border border-[#a855f7] bg-[#231640] px-2.5 py-0.5 text-xs font-medium text-[#cbb6f6]">
            Pro
          </span>
        </div>

        {/* العنوان */}
        <div className="mb-1.5 flex items-center gap-2.5">
          <span aria-hidden className="text-[#e6f1ff]">
            {brandIcon}
          </span>
          <h1 className="text-lg font-medium" style={{ fontFamily: '"Readex Pro", sans-serif' }}>
            {title}
          </h1>
        </div>
        <p className="mb-4 text-[13px] leading-7 text-[#8892b0]">{intro}</p>

        {/* صفّ الطمأنة */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {REASSURANCES.map(({ Icon, text }) => (
            <div
              key={text}
              className="rounded-lg border border-[#1d3461] bg-[#0f1f3d] p-2.5 text-center"
            >
              <Icon className="mx-auto h-[18px] w-[18px] text-[#4a9eff]" />
              <div className="mt-1.5 text-[11.5px] leading-snug text-[#8892b0]">{text}</div>
            </div>
          ))}
        </div>

        {/* الخطوات (أكورديون) */}
        <div className="mb-5 rounded-xl border border-[#1d3461] bg-[#0f1f3d] px-4">
          {steps.map((step, i) => {
            const isOpen = open === i;
            const isLast = i === steps.length - 1;
            return (
              <div key={step.title} className={i === 0 ? "" : "border-t border-[#1d3461]"}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 rounded-md py-3.5 text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4a9eff]"
                >
                  <span
                    className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border text-sm font-medium"
                    style={
                      isLast
                        ? { background: "#10331f", borderColor: "#4ade80", color: "#4ade80" }
                        : { background: "#152a4a", borderColor: accent, color: accent }
                    }
                  >
                    {isLast ? <IconCheck className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium">{step.title}</span>
                  <IconChevron
                    className={`h-[18px] w-[18px] text-[#8892b0] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pb-3.5 pl-1 pr-[42px] text-[12.5px] leading-7 text-[#8892b0]">
                    <p className="m-0">{step.detail}</p>
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#1d3461] bg-[#0a192f] px-2.5 py-2">
                      <IconKeyboard className="mt-0.5 h-[15px] w-[15px] flex-none text-[#4a9eff]" />
                      <span>
                        <span className="text-[#e6f1ff]">ماذا تكتب؟ </span>
                        {step.typeNote}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* زرّ الربط */}
        <a
          href={connectHref}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] py-3 text-[15px] font-medium text-[#0a192f] transition-opacity hover:opacity-90"
          style={{ background: accent }}
        >
          <span aria-hidden>{brandIcon}</span>
          {ctaLabel}
        </a>

        {/* تذييل الأمان */}
        <div className="mt-3 flex items-center justify-center gap-1.5">
          <IconLock className="h-3.5 w-3.5 text-[#8892b0]" />
          <span className="text-[11.5px] text-[#8892b0]">بياناتك مشفّرة ومحفوظة بأمان.</span>
        </div>
      </div>
    </div>
  );
}
