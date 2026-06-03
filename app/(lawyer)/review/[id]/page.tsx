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

  return <DraftDetailClient draft={draft} />;
}