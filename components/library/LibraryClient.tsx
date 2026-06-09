"use client";

// components/library/LibraryClient.tsx
// واجهة مكتبة المحامي الشخصيّة (Pro). هوية Dark Navy حسب الدستور §8.
// تعتمد على أفعال الخادم في lib/actions/library.ts.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  uploadCorpusItem,
  addTextCorpusItem,
  updateCorpusItem,
  deleteCorpusItem,
  type CorpusItem,
} from "@/lib/actions/library";

const DOC_TYPES = ["مستند", "عقد", "مذكرة", "لائحة داخلية", "بحث", "مرافعة", "استشارة"];

const C = {
  bg: "var(--bg-primary)",
  card: "var(--bg-card)",
  elevated: "var(--bg-elevated)",
  border: "var(--border)",
  text: "var(--text-primary)",
  sub: "var(--text-secondary)",
  pro: "var(--accent-pro)",
  ok: "var(--success)",
  danger: "var(--danger)",
};

const mono = { fontFamily: "JetBrains Mono, monospace" } as const;

function fmtDate(iso: string) {
  return iso?.slice(0, 10) ?? "";
}

type Msg = { kind: "ok" | "err"; text: string } | null;

export default function LibraryClient({
  initialItems,
  loadError,
}: {
  initialItems: CorpusItem[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"file" | "text">("file");
  const [msg, setMsg] = useState<Msg>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // حقول نموذج الإضافة
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [tags, setTags] = useState("");
  const [text, setText] = useState("");

  const items = initialItems;

  function resetForm() {
    setTitle("");
    setDocType(DOC_TYPES[0]);
    setTags("");
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleAdd() {
    setMsg(null);
    const tagsArr = tags.split(",").map((t) => t.trim()).filter(Boolean);

    if (mode === "file") {
      const file = fileRef.current?.files?.[0];
      if (!file) return setMsg({ kind: "err", text: "اختر ملفّ PDF أو DOCX أوّلًا." });
      if (!title.trim()) return setMsg({ kind: "err", text: "العنوان مطلوب." });
      const fd = new FormData();
      fd.set("file", file);
      fd.set("title", title.trim());
      fd.set("document_type", docType);
      fd.set("tags", tagsArr.join(","));
      startTransition(async () => {
        const res = await uploadCorpusItem(fd);
        if (res.ok) {
          setMsg({ kind: "ok", text: `أُضيف "${res.data.title}" إلى مكتبتك.` });
          resetForm();
          router.refresh();
        } else {
          setMsg({ kind: "err", text: res.error });
        }
      });
    } else {
      if (!title.trim()) return setMsg({ kind: "err", text: "العنوان مطلوب." });
      if (!text.trim()) return setMsg({ kind: "err", text: "النصّ مطلوب." });
      startTransition(async () => {
        const res = await addTextCorpusItem({
          title: title.trim(),
          full_text: text.trim(),
          document_type: docType,
          tags: tagsArr,
        });
        if (res.ok) {
          setMsg({ kind: "ok", text: `أُضيف "${res.data.title}" إلى مكتبتك.` });
          resetForm();
          router.refresh();
        } else {
          setMsg({ kind: "err", text: res.error });
        }
      });
    }
  }

  function handleDelete(item: CorpusItem) {
    if (!confirm(`حذف "${item.title}" نهائيًّا؟ لا يمكن التراجع.`)) return;
    startTransition(async () => {
      const res = await deleteCorpusItem(item.id);
      if (res.ok) {
        setMsg({ kind: "ok", text: "حُذف المستند." });
        router.refresh();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    });
  }

  return (
    <div
      dir="rtl"
      style={{ background: C.bg, color: C.text, minHeight: "100vh" }}
      className="px-4 py-8 md:px-8"
    >
      <div className="mx-auto max-w-4xl">
        {/* العنوان + شارة Pro */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">مكتبتي القانونيّة</h1>
              <span
                className="rounded-md px-2 py-0.5 text-xs font-semibold"
                style={{ ...mono, color: C.pro, border: `1px solid ${C.pro}` }}
              >
                Pro
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: C.sub }}>
              ارفع مستنداتك ليبني Lawyer ID مسوّداتك من معرفتك أنت.
            </p>
          </div>
          <span style={{ ...mono, color: C.sub }} className="text-sm">
            {items.length} مستند
          </span>
        </header>

        {/* رسائل */}
        {(msg || loadError) && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              background: C.card,
              border: `1px solid ${
                msg?.kind === "ok" ? C.ok : msg?.kind === "err" || loadError ? C.danger : C.border
              }`,
              color: msg?.kind === "ok" ? C.ok : C.danger,
            }}
          >
            {msg?.text ?? loadError}
          </div>
        )}

        {/* نموذج الإضافة */}
        <section
          className="mb-8 rounded-xl p-5"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="mb-4 flex gap-2">
            {(["file", "text"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: mode === m ? C.pro : C.elevated,
                  color: mode === m ? "#fff" : C.sub,
                  border: `1px solid ${mode === m ? C.pro : C.border}`,
                }}
              >
                {m === "file" ? "رفع ملفّ" : "لصق نصّ"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان المستند"
              className="rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
            />
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="وسوم (افصل بفواصل): تجاري، عقود، إفلاس"
            className="mt-3 w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
          />

          {mode === "file" ? (
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-3 w-full rounded-md px-3 py-2 text-sm"
              style={{ background: C.elevated, color: C.sub, border: `1px solid ${C.border}` }}
            />
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="الصق نصّ المستند هنا…"
              rows={6}
              className="mt-3 w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
            />
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleAdd}
              disabled={pending}
              className="rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: C.pro, color: "#fff" }}
            >
              {pending ? "جارٍ الحفظ…" : mode === "file" ? "رفع وإضافة" : "إضافة المستند"}
            </button>
            {mode === "file" && (
              <span className="text-xs" style={{ color: C.sub }}>
                PDF أو DOCX · حتى 15MB · النصّ يُستخلَص تلقائيًّا
              </span>
            )}
          </div>
        </section>

        {/* القائمة */}
        {items.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: C.card, border: `1px dashed ${C.border}`, color: C.sub }}
          >
            مكتبتك فارغة. ارفع أوّل مستند ليصير مصدرًا لمسوّداتك.
          </div>
        ) : (
          <ul className="grid gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl p-4"
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  opacity: item.is_active ? 1 : 0.55,
                }}
              >
                {editId === item.id ? (
                  <EditRow
                    item={item}
                    pending={pending}
                    onCancel={() => setEditId(null)}
                    onSave={(patch) =>
                      startTransition(async () => {
                        const res = await updateCorpusItem(item.id, patch);
                        if (res.ok) {
                          setEditId(null);
                          setMsg({ kind: "ok", text: "حُدِّث المستند." });
                          router.refresh();
                        } else {
                          setMsg({ kind: "err", text: res.error });
                        }
                      })
                    }
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{item.title}</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-xs"
                          style={{ background: C.elevated, color: C.sub }}
                        >
                          {item.document_type ?? "مستند"}
                        </span>
                        {!item.is_active && (
                          <span className="text-xs" style={{ color: C.sub }}>
                            (مُعطَّل)
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs" style={{ color: C.sub }}>
                        {item.file_name && (
                          <span className="truncate" style={{ maxWidth: 260 }}>
                            📄 {item.file_name}
                          </span>
                        )}
                        <span style={mono}>{fmtDate(item.created_at)}</span>
                        {item.file_type && <span style={mono}>{item.file_type}</span>}
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded px-1.5 py-0.5 text-xs"
                              style={{ color: C.pro, border: `1px solid ${C.pro}` }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => setEditId(item.id)}
                        className="rounded-md px-2.5 py-1 text-xs"
                        style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={pending}
                        className="rounded-md px-2.5 py-1 text-xs disabled:opacity-50"
                        style={{ color: C.danger, border: `1px solid ${C.danger}` }}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EditRow({
  item,
  pending,
  onSave,
  onCancel,
}: {
  item: CorpusItem;
  pending: boolean;
  onSave: (patch: Partial<Pick<CorpusItem, "title" | "document_type" | "summary" | "tags" | "is_active">>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [docType, setDocType] = useState(item.document_type ?? "مستند");
  const [summary, setSummary] = useState(item.summary ?? "");
  const [tags, setTags] = useState((item.tags ?? []).join("، "));
  const [active, setActive] = useState(item.is_active);

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
        />
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
        >
          {DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="ملخّص (اختياريّ)"
        rows={2}
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="وسوم مفصولة بفواصل"
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
      />
      <label className="flex items-center gap-2 text-sm" style={{ color: C.sub }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        مُفعَّل (يُستخدَم في توليد المسوّدات)
      </label>
      <div className="flex gap-2">
        <button
          onClick={() =>
            onSave({
              title: title.trim(),
              document_type: docType,
              summary: summary.trim() || null,
              tags: tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean),
              is_active: active,
            })
          }
          disabled={pending}
          className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: C.pro, color: "#fff" }}
        >
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm"
          style={{ background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
