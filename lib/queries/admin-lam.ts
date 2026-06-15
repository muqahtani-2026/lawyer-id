import { supabaseAdmin } from "@/lib/supabase/admin";

/* ----------------------------- نظرة عامّة ----------------------------- */
export async function getLamOverview() {
  const a = supabaseAdmin;
  const head = { count: "exact" as const, head: true };
  const [
    professionals,
    premium,
    pro,
    articlesPublished,
    articlesPending,
    questionsPending,
    answersPending,
    leadsTotal,
    leadsNew,
    activeSubs,
    pendingApprovals,
    ingestPending,
  ] = await Promise.all([
    a.from("profiles").select("*", head),
    a.from("profiles").select("*", head).eq("tier", "premium"),
    a.from("profiles").select("*", head).eq("tier", "pro"),
    a.from("articles").select("*", head).eq("status", "published"),
    a.from("articles").select("*", head).eq("status", "pending"),
    a.from("questions").select("*", head).eq("status", "pending"),
    a.from("answers").select("*", head).eq("status", "submitted"),
    a.from("communication_requests").select("*", head),
    a.from("communication_requests").select("*", head).eq("status", "new"),
    a.from("subscriptions").select("*", head).eq("status", "active"),
    a.from("profiles").select("*", head).eq("is_admin", false).eq("approval_status", "pending"),
    a.from("regulation_ingest").select("*", head).eq("status", "pending"),
  ]);
  const n = (r: { count: number | null }) => r.count ?? 0;
  const professionalsN = n(professionals);
  return {
    professionals: professionalsN,
    premium: n(premium),
    pro: n(pro),
    free: Math.max(professionalsN - n(premium) - n(pro), 0),
    articlesPublished: n(articlesPublished),
    articlesPending: n(articlesPending),
    questionsPending: n(questionsPending),
    answersPending: n(answersPending),
    leadsTotal: n(leadsTotal),
    leadsNew: n(leadsNew),
    activeSubs: n(activeSubs),
    pendingApprovals: n(pendingApprovals),
    ingestPending: n(ingestPending),
  };
}

async function authorNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);
  const map: Record<string, string> = {};
  (data ?? []).forEach((p) => (map[p.id] = p.full_name ?? "—"));
  return map;
}

/* ------------------------------ المقالات ------------------------------ */
export async function getArticlesForModeration(status?: string) {
  let q = supabaseAdmin
    .from("articles")
    .select("id, slug, title, excerpt, body, status, professional_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = data ?? [];
  const names = await authorNames(rows.map((r) => r.professional_id));
  return rows.map((r) => ({ ...r, author_name: names[r.professional_id] ?? "—" }));
}

/* ------------------------------ الأسئلة ------------------------------- */
export async function getQuestionsForModeration() {
  const { data: questions } = await supabaseAdmin
    .from("questions")
    .select("id, title, body, status, asker_contact, specialty_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const qrows = questions ?? [];

  const { data: answers } = await supabaseAdmin
    .from("answers")
    .select("id, question_id, body, status, professional_id")
    .in("question_id", qrows.map((q) => q.id).length ? qrows.map((q) => q.id) : ["00000000-0000-0000-0000-000000000000"]);

  const names = await authorNames((answers ?? []).map((a) => a.professional_id));
  const byQuestion: Record<string, Array<Record<string, unknown>>> = {};
  (answers ?? []).forEach((a) => {
    (byQuestion[a.question_id] ??= []).push({ ...a, author_name: names[a.professional_id] ?? "—" });
  });

  return qrows.map((q) => ({ ...q, answers: byQuestion[q.id] ?? [] }));
}

/* ------------------------------ الطلبات ------------------------------- */
export async function getAllLeads() {
  const { data } = await supabaseAdmin
    .from("communication_requests")
    .select("id, professional_id, source, channel, visitor_name, visitor_contact, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];
  const names = await authorNames(rows.map((r) => r.professional_id));
  return rows.map((r) => ({ ...r, professional_name: names[r.professional_id] ?? "—" }));
}

/* ---------------------------- الاشتراكات ----------------------------- */
export async function getAllSubscriptions() {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id, tier, status, provider, amount, currency, current_period_end, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];
  const names = await authorNames(rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, user_name: names[r.user_id] ?? "—" }));
}

/* ----------------------------- التصنيفات ----------------------------- */
export async function getTaxonomy() {
  const { data } = await supabaseAdmin
    .from("specialties")
    .select("id, name_ar, name_en, slug, description, is_active, domain")
    .order("name_ar", { ascending: true });
  return data ?? [];
}

/* --------------------------- طابور اعتماد المهنيّين --------------------------- */
export async function getPendingProfessionals() {
  const { data } = await supabaseAdmin
    .from("v_pending_professionals")
    .select("*");
  return data ?? [];
}

/** رابط موقّع لعرض وثيقة الاعتماد (صالح لمدّة قصيرة). */
export async function getCredentialSignedUrl(path: string): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabaseAdmin.storage.from("credentials").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

/* --------------------------- جلب الأنظمة (staging) --------------------------- */
export async function getIngestQueue(status: string = "pending") {
  const { data } = await supabaseAdmin
    .from("regulation_ingest")
    .select("id, source_channel, source_authority, source_url, title, specialty_id, status, fetched_at")
    .eq("status", status)
    .order("fetched_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

export async function getIngestCounts() {
  const a = supabaseAdmin;
  const head = { count: "exact" as const, head: true };
  const [pending, imported, rejected] = await Promise.all([
    a.from("regulation_ingest").select("*", head).eq("status", "pending"),
    a.from("regulation_ingest").select("*", head).eq("status", "imported"),
    a.from("regulation_ingest").select("*", head).eq("status", "rejected"),
  ]);
  return { pending: pending.count ?? 0, imported: imported.count ?? 0, rejected: rejected.count ?? 0 };
}
