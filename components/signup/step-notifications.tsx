"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { SignupFormData } from "@/lib/signup/types";

export interface StepNotificationsProps {
  data: SignupFormData;
  onChange: (patch: Partial<SignupFormData>) => void;
  errors?: Partial<Record<keyof SignupFormData, string>>;
}

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, enabled, onChange }) => {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-bg-elevated">
      <div className="flex flex-col gap-1 flex-1">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary leading-relaxed">{description}</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
          enabled ? "bg-accent-lawyer" : "bg-bg-card border border-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-text-primary transition-all duration-200",
            enabled ? "right-[22px]" : "right-0.5"
          )}
        />
      </button>
    </div>
  );
};

const StepNotifications: React.FC<StepNotificationsProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-display font-semibold text-text-primary">
          تفضيلات التوزيع
        </h2>
        <p className="text-sm text-text-secondary">
          أين تريد أن تصلك المسوّدات؟ يُمكنك اختيار قناة واحدة أو الاثنتَين.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <ToggleRow
          label="عبر Telegram"
          description="يصلك إشعار فوريّ بكلّ مسوّدة جديدة على Telegram."
          enabled={data.telegram_enabled}
          onChange={(v) => onChange({ telegram_enabled: v })}
        />

        <ToggleRow
          label="عبر البريد الإلكترونيّ"
          description="ملخّص يوميّ على بريدك بكلّ المسوّدات الجديدة."
          enabled={data.email_enabled}
          onChange={(v) => onChange({ email_enabled: v })}
        />
      </div>

      {errors.telegram_enabled && (
        <p className="text-sm text-danger" role="alert">{errors.telegram_enabled}</p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="send-hour" className="text-sm font-medium text-text-primary">
          الساعة المُفضَّلة للاستلام يوميًّا (بتوقيت الرياض)
        </label>
        <input
          id="send-hour"
          type="number"
          min={0}
          max={23}
          value={data.preferred_send_hour}
          onChange={(e) => onChange({ preferred_send_hour: Number(e.target.value) })}
          className={cn(
            "w-full md:w-40 px-4 py-2.5 rounded-lg",
            "bg-bg-elevated text-text-primary",
            "border border-border",
            "focus:outline-none focus:ring-2 focus:ring-accent-lawyer focus:border-transparent",
            "transition-colors duration-150 font-mono"
          )}
        />
        <p className="text-xs text-text-secondary">
          الافتراضيّ: 8 صباحًا. يُمكنك تغييرها لاحقًا من إعدادات حسابك.
        </p>
        {errors.preferred_send_hour && (
          <p className="text-xs text-danger" role="alert">{errors.preferred_send_hour}</p>
        )}
      </div>

      {data.telegram_enabled && (
        <div className="p-4 rounded-lg border border-accent-lawyer/30 bg-accent-lawyer/5">
          <p className="text-sm text-text-primary mb-2 font-medium">
            🤖 لتفعيل Telegram بعد التسجيل:
          </p>
          <ol className="text-xs text-text-secondary list-decimal pr-4 space-y-1 leading-relaxed">
            <li>ابحث عن البوت: <code className="font-mono text-accent-lawyer">@LawyerIDSA_bot</code></li>
            <li>أرسل له <code className="font-mono text-accent-lawyer">/start</code></li>
            <li>سيُرسل لك رمز تفعيل — ألصِقه في صفحة حسابك بعد التسجيل.</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export { StepNotifications };