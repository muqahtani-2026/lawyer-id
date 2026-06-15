"use client";

// components/library/LibraryClient.tsx
// واجهة مكتبة المحامي الشخصيّة (Pro). هوية Dark Navy حسب الدستور §8.
// Phase 8.5: بحث/تصفية + سحب-وإفلات + معاينة النصّ المستخلَص + تنزيل + إحصاءات.
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  uploadCorpusItem,
  addTextCorpusItem,
  updateCorpusItem,
  deleteCorpusItem,
  getCorpusDownloadUrl,
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
  blue: "var(--accent-lawyer)",
  ok: "var(--success)",
  danger: "var(--danger)",
};

const mono = { fontFamily: "JetBrains Mono, monospace" } as const;

function fmtDate(iso: string) {
  return iso?.slice(0, 10) ?? "";
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

function wordCount(text: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const PREVIEW_CHARS = 1500;

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
  const [previewId, setPreviewId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // حقول نموذج الإضافة
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [tags, setTags] = useState("");
  const [text, setText] = useState("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // فلاتر — Phase 8.5
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const items = initialItems;

  // اختفاء الرسائل تلقائيًّا
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4500);
    return () => clearTimeout(t);
  }, [msg]);

  // إحصاءات
  const stats = useMemo(() => {
    const active = items.filter((i) => i.is_active).length;
    const words = items.reduce((sum, i) => sum + wordCount(i.full_text), 0);
    return { total: items.length, active, inactive: items.length - active, words };
  }, [items]);

  // التصفية
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (typeFilter !== "all" && (i.document_type ?? "مستند") !== typeFilter) return false;
      if (statusFilter === "active" && !i.is_active) return false;
      if (statusFilter === "inactive" && i.is_active) return false;
      if (!q) return true;
      const hay = [i.title, i.file_name ?? "", ...(i.tags ?? [])].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, typeFilter, statusFilter]);

  const hasFilters = search.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  function resetForm() {
    setTitle("");
    setDocType(DOC_TYPES[0]);
    setTags("");
    setText("");
    setPickedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  /** اختيار ملفّ (من الزرّ أو بالإفلات) + ملء العنوان تلقائيًّا إن كان فارغًا */
  function acceptFile(file: File | null) {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setMsg({ kind: "err", text: "الملفّ يجب أن يكون PDF أو DOCX." });
      return;
    }
    setPickedFile(file);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.(pdf|docx)$/i, ""));
    }
  }

  function handleAdd() {
    setMsg(null);
    const tagsArr = tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean);

    if (mode === "file") {
      const file = pickedFile ?? fileRef.current?.files?.[0] ?? null;
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
          setMsg({
            kind: "ok",
            text: `أُضيف "${res.data.title}" — استُخلص ${wordCount(res.data.full_text).toLocaleString("ar")} كلمة.`,
          });
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

  function handleDownload(item: CorpusItem) {
    startTransition(async () => {
      const res = await getCorpusDownloadUrl(item.id);
      if (res.ok) {
        window.open(res.data.url, "_blank", "noopener");
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
        <header className="mb-4 flex items-center justify-between gap-3">
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
              ارفع مستنداتك ليبني لام مسوّداتك من معرفتك أنت.
            </p>
          </div>
        </header>

        {/* شريط الإحصاءات — Phase 8.5 */}
        <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: "المستندات", value: stats.total.toLocaleString("ar") },
            { label: "مفعَّلة", value: stats.active.toLocaleString("ar"), color: C.ok },
            { label: "معطَّلة", value: stats.inactive.toLocaleString("ar"), color: C.sub },
            { label: "إجماليّ الكلمات", value: stats.words.toLocaleString("ar"), color: C.blue },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg px-3 py-2.5"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="text-lg font-bold" style={{ ...mono, color: s.color ?? C.text }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: C.sub }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

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
          className="mb-6 rounded-xl p-5"
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

          {/* منطقة السحب-والإفلات — Phase 8.5 */}
          {mode === "file" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                acceptFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => fileRef.current?.click()}
              className="mb-3 cursor-pointer rounded-xl p-6 text-center transition-colors"
              style={{
                background: dragOver ? C.elevated : "transparent",
                border: `2px dashed ${dragOver ? C.pro : C.border}`,
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
              />
              {pickedFile ? (
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span>📄</span>
                  <span className="font-semibold">{pickedFile.name}</span>
                  <span style={{ ...mono, color: C.sub }}>{fmtBytes(pickedFile.size)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPickedFile(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="rounded px-2 py-0.5 text-xs"
                    style={{ color: C.danger, border: `1px solid ${C.danger}` }}
                  >
                    إزالة
                  </button>
                </div>
              ) : (
                <div className="text-sm" style={{ color: C.sub }}>
                  <div className="mb-1 text-2xl">⬆️</div>
                  اسحب ملفّك هنا أو <span style={{ color: C.pro }}>اضغط للاختيار</span>
                  <div className="mt-1 text-xs">PDF أو DOCX · حتى 15MB · النصّ يُستخلَص تلقائيًّا</div>
                </div>
              )}
            </div>
          )}

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

          {mode === "text" && (
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
            {mode === "text" && (
              <span className="text-xs" style={{ ...mono, color: C.sub }}>
                {wordCount(text).toLocaleString("ar")} كلمة
              </span>
            )}
          </div>
        </section>

        {/* شريط البحث والتصفية — Phase 8.5 */}
        {items.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 ابحث بالعنوان أو الوسم أو اسم الملفّ…"
              className="min-w-0 flex-1 rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}
            >
              <option value="all">كلّ الأنواع</option>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: C.card, color: C.text, border: `1px solid ${C.border}` }}
            >
              <option value="all">الكلّ</option>
              <option value="active">مفعَّلة</option>
              <option value="inactive">معطَّلة</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="rounded-md px-3 py-2 text-sm"
                style={{ background: C.elevated, color: C.sub, border: `1px solid ${C.border}` }}
              >
                مسح
              </button>
            )}
          </div>
        )}

        {/* عدّاد النتائج عند التصفية */}
        {hasFilters && (
          <div className="mb-3 text-xs" style={{ color: C.sub }}>
            {filtered.length.toLocaleString("ar")} من {items.length.toLocaleString("ar")} مستند
          </div>
        )}

        {/* القائمة */}
        {items.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: C.card, border: `1px dashed ${C.border}`, color: C.sub }}
          >
            مكتبتك فارغة. ارفع أوّل مستند ليصير مصدرًا لمسوّداتك.
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ background: C.card, border: `1px dashed ${C.border}`, color: C.sub }}
          >
            لا نتائج مطابقة — جرّب كلمات أخرى أو امسح الفلاتر.
          </div>
        ) : (
          <ul className="grid gap-3">
            {filtered.map((item) => {
              const words = wordCount(item.full_text);
              const isPreview = previewId === item.id;
              return (
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
                    <>
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
                          <div
                            className="mt-1 flex flex-wrap items-center gap-3 text-xs"
                            style={{ color: C.sub }}
                          >
                            {item.file_name && (
                              <span className="truncate" style={{ maxWidth: 260 }}>
                                📄 {item.file_name}
                              </span>
                            )}
                            <span style={mono}>{fmtDate(item.created_at)}</span>
                            <span style={{ ...mono, color: words === 0 ? C.danger : C.sub }}>
                              {words === 0
                                ? "⚠️ لا نصّ مستخلَص"
                                : `${words.toLocaleString("ar")} كلمة`}
                            </span>
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
                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                          <button
                            onClick={() => setPreviewId(isPreview ? null : item.id)}
                            className="rounded-md px-2.5 py-1 text-xs"
                            style={{
                              background: isPreview ? C.elevated : "transparent",
                              color: C.blue,
                              border: `1px solid ${C.blue}`,
                            }}
                          >
                            {isPreview ? "إغلاق" : "معاينة"}
                          </button>
                          {item.file_path && (
                            <button
                              onClick={() => handleDownload(item)}
                              disabled={pending}
                              className="rounded-md px-2.5 py-1 text-xs disabled:opacity-50"
                              style={{
                                background: C.elevated,
                                color: C.text,
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              تنزيل
                            </button>
                          )}
                          <button
                            onClick={() => setEditId(item.id)}
                            className="rounded-md px-2.5 py-1 text-xs"
                            style={{
                              background: C.elevated,
                              color: C.text,
                              border: `1px solid ${C.border}`,
                            }}
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

                      {/* معاينة النصّ المستخلَص — Phase 8.5 */}
                      {isPreview && (
                        <div
                          className="mt-3 rounded-lg p-3"
                          style={{ background: C.bg, border: `1px solid ${C.border}` }}
                        >
                          <div
                            className="mb-2 flex items-center justify-between text-xs"
                            style={{ color: C.sub }}
                          >
                            <span>النصّ المستخلَص (هذا ما تستقي منه مسوّداتك):</span>
                            <span style={mono}>
                              {words.toLocaleString("ar")} كلمة ·{" "}
                              {(item.full_text?.length ?? 0).toLocaleString("ar")} حرف
                            </span>
                          </div>
                          {item.full_text ? (
                            <pre
                              className="max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed"
                              style={{ color: C.text, fontFamily: "inherit" }}
                            >
                              {item.full_text.slice(0, PREVIEW_CHARS)}
                              {item.full_text.length > PREVIEW_CHARS && (
                                <span style={{ color: C.sub }}>
                                  {"\n"}… (يُعرض أوّل {PREVIEW_CHARS.toLocaleString("ar")} حرف)
                                </span>
                              )}
                            </pre>
                          ) : (
                            <div className="text-sm" style={{ color: C.danger }}>
                              ⚠️ لا يوجد نصّ مستخلَص — هذا المستند لن يفيد التوليد. جرّب ملفًّا
                              نصّيًّا (غير ممسوح ضوئيًّا) أو الصق النصّ يدويًّا.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </li>
              );
            })}
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
  onSave: (
    patch: Partial<Pick<CorpusItem, "title" | "document_type" | "summary" | "tags" | "is_active">>
  ) => void;
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
