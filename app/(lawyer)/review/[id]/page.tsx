import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDraftById } from "@/lib/queries/review";
import { DraftDetailClient } from "@/components/review/DraftDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { id } = await params;

  const draft = await getDraftById(user.id, id);

  if (!draft) {
    notFound();
  }

  // --- سياق النشر على X (Pro) ---
  const [{ data: profile }, { data: xCred }, { data: meta }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("lawyer_x_credentials")
      .select("x_username")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("content_drafts")
      .select("content_format, published_at")
      .eq("id", id)
      .single(),
  ]);

  const isPro = profile?.tier === "pro";
  const xConnected = !!xCred;
  const isXFormat = meta?.content_format === "x_short";
  const xAlreadyPublished = !!meta?.published_at;

  return (
    <DraftDetailClient
      draft={draft}
      isPro={isPro}
      xConnected={xConnected}
      isXFormat={isXFormat}
      xAlreadyPublished={xAlreadyPublished}
    />
  );
}
