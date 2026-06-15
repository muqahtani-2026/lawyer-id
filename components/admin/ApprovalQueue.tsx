"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { adminApproveProfessional, adminRejectProfessional, adminCredentialUrl } from "@/lib/actions/admin-lam";

const KIND_LABEL: Record<string, string> = {
  lawyer: "محامٍ",
  trainee: "متدرّب",
  legal_consultant: "مستشار قانونيّ",
};

interface Pending {
  id: string;
  full_name: string | null;
  email: string;
  professional_kind: string | null;
  credential_doc_path: string | null;
  credential_doc_type: string | null;
  credential_number: string | null;
  city: string | null;
  headline: string | null;
  specialty_name: string | null;
  created_at: string;
}

export function ApprovalQueue({ initial }: { initial: Pending[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function viewDoc(path: string | null) {
    if (!path) { setMsg("لا توجد وثيقة مرفقة."); return; }
    const res = await adminCredentialUrl(path);
    if (res.ok && res.url) window.open(res.url, "_blank");
    else setMsg(res.error ?? "تعذّر فتح الوثيقة.");
  }

  async function approve(id: string) {
    setBusy(id); setMsg(null);
    const res = await adminApproveProfessional(id);
    setBusy(null);
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== id)); setMsg("تمّ الاعتماد ✓"); }
    else setMsg(res.error ?? "خطأ");
  }

  async function reject(id: string) {
    const note = window.prompt("سبب الرفض (يظهر للمهنيّ):", "الوثيقة غير واضحة أو غير مطابقة");
    if (note === null) return;
    setBusy(id); setMsg(null);
    const res = await adminRejectProfessional(id, note);
    setBusy(null);
    if (res.ok) { setRows((r) => r.filter((x) => x.id !== id)); setMsg("تمّ الرفض"); }
    else setMsg(res.error ?? "خطأ");
  }

  if (rows.length === 0) {
    return <div className="rounded-xl border border-dashed border-[#1d3461] bg-[#0f1f3d] p-10 text-center text-[#8892b0]">لا طلبات بانتظار الاعتماد.</div>;
  }

  return (
    <div className="space-y-4">
      {msg && <div className="text-sm text-[#8892b0]">{msg}</div>}
      {rows.map((p) => (
        <div key={p.id} className="rounded-xl border border-[#1d3461] bg-[#0f1f3d] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#e6f1ff]">{p.full_name ?? "—"}</span>
                <span className="rounded bg-[#152a4a] px-2 py-0.5 text-xs text-[#8892b0]">{KIND_LABEL[p.professional_kind ?? ""] ?? p.professional_kind}</span>
                {p.specialty_name && <span className="rounded bg-[#152a4a] px-2 py-0.5 text-xs text-[#8892b0]">{p.specialty_name}</span>}
              </div>
              <div className="mt-1 text-sm text-[#8892b0]">
                <span dir="ltr" className="font-mono">{p.email}</span>
                {p.city && <span> · {p.city}</span>}
                {p.credential_number && <span> · رقم: {p.credential_number}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => viewDoc(p.credential_doc_path)} className={buttonClasses("outline", "sm")}>عرض الوثيقة</button>
              <button onClick={() => approve(p.id)} disabled={busy === p.id} className={buttonClasses("primary", "sm")}>اعتماد</button>
              <button onClick={() => reject(p.id)} disabled={busy === p.id} className={buttonClasses("danger", "sm")}>رفض</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
