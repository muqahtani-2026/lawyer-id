import { createClient } from "@/lib/supabase/server";

// ============================================================
// Types
// ============================================================

export type AdminLawyerRow = {
  id: string;
  full_name: string | null;
  email: string;
  is_admin: boolean;
  created_at: string;
  primary_specialty: string | null;
  drafts_count: number;
  last_activity: string | null;
  has_lawyer_profile: boolean;
  samples_count: number;
};

export type AdminLawyerDetail = {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    is_admin: boolean;
    is_public: boolean;
    tier: string | null;
    approval_status: string | null;
    professional_kind: string | null;
    credential_doc_path: string | null;
    created_at: string;
  };
  lawyer_profile: {
    writing_style: string | null;
    preferred_length: string | null;
    target_audience: string | null;
    style_notes: string | null;
    role: string | null;
    years_experience: number | null;
    favorite_phrases: string[] | null;
    avoided_phrases: string[] | null;
    interests: string[] | null;
  } | null;
  specialties: {
    id: string;
    name_ar: string;
    is_primary: boolean;
  }[];
  notification_prefs: {
    telegram_enabled: boolean;
    telegram_chat_id: string | null;
    email_enabled: boolean;
    email_address: string | null;
    preferred_send_hour: number;
  } | null;
  samples: {
    id: string;
    title: string | null;
    sample_type: string;
    content_preview: string;
    platform_context: string | null;
    created_at: string;
  }[];
  recent_drafts: {
    id: string;
    draft_title: string | null;
    status: string;
    quality_score: number | null;
    created_at: string;
    updated_at: string;
  }[];
};

// ============================================================
// listLawyers — table data
// ============================================================

export async function listLawyers(): Promise<AdminLawyerRow[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, created_at")
    .order("created_at", { ascending: false });

  if (!profiles || profiles.length === 0) return [];

  const userIds = profiles.map((p) => p.id);

  const [draftsRes, userSpecsRes, lawyerProfsRes, samplesRes] =
    await Promise.all([
      supabase
        .from("content_drafts")
        .select("user_id, updated_at")
        .in("user_id", userIds),
      supabase
        .from("user_specialties")
        .select("user_id, specialty_id, is_primary")
        .in("user_id", userIds),
      supabase
        .from("lawyer_profiles")
        .select("user_id")
        .in("user_id", userIds),
      supabase
        .from("writing_samples")
        .select("user_id")
        .in("user_id", userIds),
    ]);

  const draftCounts = new Map<string, number>();
  const lastActivity = new Map<string, string>();
  (draftsRes.data ?? []).forEach((d: any) => {
    if (!d.user_id) return;
    draftCounts.set(d.user_id, (draftCounts.get(d.user_id) ?? 0) + 1);
    const cur = lastActivity.get(d.user_id);
    if (!cur || (d.updated_at as string) > cur) {
      lastActivity.set(d.user_id, d.updated_at as string);
    }
  });

  const specIds = [
    ...new Set(
      (userSpecsRes.data ?? [])
        .map((u: any) => u.specialty_id as string)
        .filter(Boolean)
    ),
  ];

  let specNameMap = new Map<string, string>();
  if (specIds.length > 0) {
    const { data: specs } = await supabase
      .from("specialties")
      .select("id, name_ar")
      .in("id", specIds);
    specNameMap = new Map(
      (specs ?? []).map((s) => [s.id as string, s.name_ar as string])
    );
  }

  const primarySpecMap = new Map<string, string>();
  (userSpecsRes.data ?? []).forEach((u: any) => {
    const name = specNameMap.get(u.specialty_id);
    if (!name) return;
    const existing = primarySpecMap.get(u.user_id);
    if (u.is_primary || !existing) {
      primarySpecMap.set(u.user_id, name);
    }
  });

  const hasLawyerProfile = new Set<string>();
  (lawyerProfsRes.data ?? []).forEach((p: any) => {
    if (p.user_id) hasLawyerProfile.add(p.user_id);
  });

  const samplesCount = new Map<string, number>();
  (samplesRes.data ?? []).forEach((s: any) => {
    if (!s.user_id) return;
    samplesCount.set(s.user_id, (samplesCount.get(s.user_id) ?? 0) + 1);
  });

  return profiles.map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string | null) ?? null,
    email: p.email as string,
    is_admin: (p.is_admin as boolean) ?? false,
    created_at: p.created_at as string,
    primary_specialty: primarySpecMap.get(p.id as string) ?? null,
    drafts_count: draftCounts.get(p.id as string) ?? 0,
    last_activity: lastActivity.get(p.id as string) ?? null,
    has_lawyer_profile: hasLawyerProfile.has(p.id as string),
    samples_count: samplesCount.get(p.id as string) ?? 0,
  }));
}

// ============================================================
// getLawyerDetail — single lawyer full data
// ============================================================

export async function getLawyerDetail(
  userId: string
): Promise<AdminLawyerDetail | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_admin, is_public, tier, approval_status, professional_kind, credential_doc_path, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const [
    lawyerProfileRes,
    userSpecsRes,
    notifPrefsRes,
    samplesRes,
    draftsRes,
  ] = await Promise.all([
    supabase
      .from("lawyer_profiles")
      .select(
        "writing_style, preferred_length, target_audience, style_notes, role, years_experience, favorite_phrases, avoided_phrases, interests"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_specialties")
      .select("specialty_id, is_primary")
      .eq("user_id", userId),
    supabase
      .from("notification_preferences")
      .select(
        "telegram_enabled, telegram_chat_id, email_enabled, email_address, preferred_send_hour"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("writing_samples")
      .select("id, title, sample_text, sample_type, platform_context, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("content_drafts")
      .select(
        "id, draft_title, status, quality_score, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  // Resolve specialty names
  const specIds = (userSpecsRes.data ?? []).map(
    (s: any) => s.specialty_id as string
  );
  let specNameMap = new Map<string, string>();
  if (specIds.length > 0) {
    const { data: specs } = await supabase
      .from("specialties")
      .select("id, name_ar")
      .in("id", specIds);
    specNameMap = new Map(
      (specs ?? []).map((s) => [s.id as string, s.name_ar as string])
    );
  }

  const specialties = (userSpecsRes.data ?? []).map((s: any) => ({
    id: s.specialty_id as string,
    name_ar: specNameMap.get(s.specialty_id) ?? "—",
    is_primary: (s.is_primary as boolean) ?? false,
  }));

  const samples = (samplesRes.data ?? []).map((s: any) => ({
    id: s.id as string,
    title: (s.title as string | null) ?? null,
    sample_type: (s.sample_type as string) ?? "social",
    content_preview: ((s.sample_text as string) ?? "").slice(0, 220),
    platform_context: (s.platform_context as string | null) ?? null,
    created_at: s.created_at as string,
  }));

  return {
    profile: {
      id: profile.id as string,
      full_name: (profile.full_name as string | null) ?? null,
      email: profile.email as string,
      is_admin: (profile.is_admin as boolean) ?? false,
      is_public: (profile.is_public as boolean) ?? false,
      tier: (profile.tier as string | null) ?? null,
      approval_status: (profile.approval_status as string | null) ?? null,
      professional_kind: (profile.professional_kind as string | null) ?? null,
      credential_doc_path: (profile.credential_doc_path as string | null) ?? null,
      created_at: profile.created_at as string,
    },
    lawyer_profile: lawyerProfileRes.data
      ? {
          writing_style:
            (lawyerProfileRes.data.writing_style as string | null) ?? null,
          preferred_length:
            (lawyerProfileRes.data.preferred_length as string | null) ?? null,
          target_audience:
            (lawyerProfileRes.data.target_audience as string | null) ?? null,
          style_notes:
            (lawyerProfileRes.data.style_notes as string | null) ?? null,
          role: (lawyerProfileRes.data.role as string | null) ?? null,
          years_experience:
            (lawyerProfileRes.data.years_experience as number | null) ?? null,
          favorite_phrases:
            (lawyerProfileRes.data.favorite_phrases as string[] | null) ?? null,
          avoided_phrases:
            (lawyerProfileRes.data.avoided_phrases as string[] | null) ?? null,
          interests:
            (lawyerProfileRes.data.interests as string[] | null) ?? null,
        }
      : null,
    specialties,
    notification_prefs: notifPrefsRes.data
      ? {
          telegram_enabled:
            (notifPrefsRes.data.telegram_enabled as boolean) ?? false,
          telegram_chat_id:
            (notifPrefsRes.data.telegram_chat_id as string | null) ?? null,
          email_enabled:
            (notifPrefsRes.data.email_enabled as boolean) ?? false,
          email_address:
            (notifPrefsRes.data.email_address as string | null) ?? null,
          preferred_send_hour:
            (notifPrefsRes.data.preferred_send_hour as number) ?? 8,
        }
      : null,
    samples,
    recent_drafts: (draftsRes.data ?? []).map((d: any) => ({
      id: d.id as string,
      draft_title: (d.draft_title as string | null) ?? null,
      status: d.status as string,
      quality_score: (d.quality_score as number | null) ?? null,
      created_at: d.created_at as string,
      updated_at: d.updated_at as string,
    })),
  };
}
