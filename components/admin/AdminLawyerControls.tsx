"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { adminSetProfessionalPublic, adminSetProfessionalTier, adminApproveProfessional, adminRejectProfessional, adminCredentialUrl } from "@/lib/actions/admin-lam";

const TIERS: { value: "free" | "pro" | "premium"; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
];

const KIND_LABEL: Record<string, string> = { lawyer: "محامٍ", trainee: "متدرّب", legal_consultant: "مستشار قانونيّ" };
const STATUS_LABEL: Record<string, string> = { approved: "معتمد", pending: "بانتظار الاعتماد", rejected: "مرفوض" };
const STATUS_COLOR: Record<string, string> = { approved: "#4ade80", pending: "#fbbf24", rejected: "#ef4444" };

export function AdminLawyerControls({
  userId,
  isPublic,
  tier,
  approvalStatus,
  professionalKind,
  credentialDocPath,
}: {
  userId: string;
  isPublic: boolean;
  tier: string | null;
  approvalStatus: string | null;
  professionalKind: string | null;
  credentialDocPath: string | null;
}) {
  const [pub, setPub] = useState(!!isPublic);
  const [curTier, setCurTier] = useState((tier as "free" | "pro" | "premium") ?? "free");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState(approvalStatus ?? "approved");

  async function viewDoc() {
    if (!credentialDocPath) { setMsg("لا توجد وثيقة مرفقة."); return; }
    const res = await adminCredentialUrl(credentialDocPath);
    if (res.ok && res.url) window.open(res.url, "_blank");
    else setMsg(res.error ?? "تعذّر فتح الوثيقة.");
  }
  async function approve() {
    setPending(true); setMsg(null);
    const res = await adminApproveProfessional(userId);
    setPending(false);
    if (res.ok) { setStatus("approved"); setMsg("تمّ الاعتماد ✓"); } else setMsg(res.error ?? "خطأ");
  }
  async function reject() {
    const note = window.prompt("سبب الرفض (يظهر للمهنيّ):", "الوثيقة غير واضحة أو غير مطابقة");
    if (note === null) return;
    setPending(true); setMsg(null);
    const res = await adminRejectProfessional(userId, note);
    setPending(false);
    if (res.ok) { setStatus("rejected"); setMsg("تمّ الرفض"); } else setMsg(res.error ?? "خطأ");
  }

  async function togglePublic() {
    setPending(true); setMsg(null);
    const res = await adminSetProfessionalPublic(userId, !pub);
    setPending(false);
    if (res.ok) { setPub(!pub); setMsg("تمّ ✓"); } else setMsg(res.error ?? "خطأ");
  }
  async function changeTier(t: "free" | "pro" | "premium") {
    setPending(true); setMsg(null);
    const res = await adminSetProfessionalTier(userId, t);
    setPending(false);
    if (res.ok) { setCurTier(t); setMsg("تمّ ✓"); } else setMsg(res.error ?? "خطأ");
  }

  return (
    <div className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-mono tracking-wider text-[#fbbf24]">ADMIN · إجراءات</h3>
        {msg && <span className="text-xs text-[#8892b0]">{msg}</span>}
      </div>

      <div className="mb-5 rounded-lg border border-[#1d3461] bg-[#0a192f] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#8892b0]">النوع:</span>
          <span className="text-sm text-[#e6f1ff]">{KIND_LABEL[professionalKind ?? ""] ?? professionalKind ?? "—"}</span>
          <span className="text-xs text-[#8892b0]">· الحالة:</span>
          <span className="text-sm font-medium" style={{ color: STATUS_COLOR[status] ?? "#8892b0" }}>{STATUS_LABEL[status] ?? status}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={viewDoc} className={buttonClasses("outline", "sm")}>عرض الوثيقة</button>
          {status !== "approved" && <button onClick={approve} disabled={pending} className={buttonClasses("primary", "sm")}>اعتماد</button>}
          {status !== "rejected" && <button onClick={reject} disabled={pending} className={buttonClasses("danger", "sm")}>رفض</button>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div>
          <div className="mb-1 text-xs text-[#8892b0]">الظهور في الموقع العام</div>
          <button onClick={togglePublic} disabled={pending} className={buttonClasses(pub ? "danger" : "primary", "sm")}>
            {pub ? "تعطيل الظهور" : "تفعيل الظهور"}
          </button>
          <span className="ms-2 text-xs text-[#8892b0]">{pub ? "ظاهر الآن" : "مخفيّ"}</span>
        </div>

        <div>
          <div className="mb-1 text-xs text-[#8892b0]">المستوى (تجاوز إداريّ)</div>
          <div className="flex gap-2">
            {TIERS.map((t) => (
              <button
                key={t.value}
                onClick={() => changeTier(t.value)}
                disabled={pending || curTier === t.value}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  curTier === t.value ? "border-[#fbbf24] bg-[#fbbf24]/10 text-[#e6f1ff]" : "border-[#1d3461] text-[#8892b0] hover:border-[#fbbf24]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-[#8892b0]">التجاوز الإداريّ للمستوى لا يتعامل مع الفوترة — يُستخدم للحالات الاستثنائيّة فقط.</p>
    </div>
  );
}
