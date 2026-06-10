import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getFullProfile,
  getWritingSamples,
  getNotificationPreferences,
} from "@/lib/queries/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SamplesManager } from "@/components/profile/SamplesManager";
import { NotificationPreferences } from "@/components/profile/NotificationPreferences";
import ConnectXButton from "@/components/ConnectXButton";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS = ["style", "samples", "notifications"] as const;
type TabKey = (typeof VALID_TABS)[number];

const tabConfig: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "style",
    label: "الأسلوب",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
  },
  {
    key: "samples",
    label: "العيّنات",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="10" y1="13" x2="14" y2="13" />
        <line x1="10" y1="17" x2="14" y2="17" />
      </svg>
    ),
  },
  {
    key: "notifications",
    label: "الإشعارات",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default async function ProfilePage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  const tab: TabKey = VALID_TABS.includes(params.tab as TabKey)
    ? (params.tab as TabKey)
    : "style";

  const [profile, samples, prefs] = await Promise.all([
    getFullProfile(user.id),
    getWritingSamples(user.id),
    getNotificationPreferences(user.id),
  ]);

  // --- حالة ربط X (Pro) ---
  const [{ data: tierRow }, { data: xCred }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("lawyer_x_credentials")
      .select("x_username")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const isPro = tierRow?.tier === "pro";
  const xUsername = xCred?.x_username ?? null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header>
        <h1
          className="text-2xl md:text-3xl font-bold text-[#e6f1ff] mb-1"
          style={{ fontFamily: "'Readex Pro', system-ui, sans-serif" }}
        >
          مِلَفّي
        </h1>
        <p className="text-sm text-[#8892b0]">
          أُسلوب الكِتابة، عيّنات سابقة، وتفضيلات استلام المسوّدات.
        </p>
        {profile.full_name && (
          <p className="text-xs text-[#8892b0] mt-1">
            <span className="text-[#4a9eff]">{profile.full_name}</span>
            {profile.email && <span> · <span dir="ltr">{profile.email}</span></span>}
          </p>
        )}
      </header>

      {/* ربط النشر على X */}
      <section className="bg-[#0f1f3d] border border-[#1d3461] rounded-lg p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-semibold text-[#e6f1ff] inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#e6f1ff]">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              النشر التلقائيّ على X
            </h2>
            <p className="text-xs text-[#8892b0] mt-0.5">
              اربط حساب X لتنشر مسوّداتك بضغطة من صفحة المراجعة.
            </p>
          </div>
          <ConnectXButton isPro={isPro} connectedUsername={xUsername} />
        </div>
        {!isPro && (
          <p className="text-xs text-[#fbbf24] mt-3">النشر التلقائيّ على X ميزة Pro.</p>
        )}
      </section>

      {/* Tabs */}
      <nav className="flex items-center gap-1 border-b border-[#1d3461] overflow-x-auto -mx-2 px-2 pb-px">
        {tabConfig.map((t) => {
          const isActive = tab === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "style" ? "/profile" : `/profile?tab=${t.key}`}
              className={cn(
                "inline-flex items-center gap-2 px-3 md:px-5 py-2.5 text-sm rounded-t-md transition-colors whitespace-nowrap border-b-2",
                isActive
                  ? "border-[#4a9eff] text-[#4a9eff] bg-[#152a4a]/40"
                  : "border-transparent text-[#8892b0] hover:text-[#e6f1ff] hover:bg-[#152a4a]/30"
              )}
            >
              {t.icon}
              <span>{t.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tab content */}
      <div>
        {tab === "style" && <ProfileForm profile={profile} />}
        {tab === "samples" && <SamplesManager samples={samples} />}
        {tab === "notifications" && (
          <NotificationPreferences prefs={prefs} defaultEmail={user.email ?? null} />
        )}
      </div>
    </div>
  );
}
