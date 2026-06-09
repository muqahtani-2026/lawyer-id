// app/(lawyer)/library/page.tsx
// ضَع هذا الملفّ حيث توجد بقيّة مسارات المحامي المُصادَق عليها (نفس مكان /review).
import { listMyCorpus } from "@/lib/actions/library";
import LibraryClient from "@/components/library/LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const res = await listMyCorpus();
  const items = res.ok ? res.data : [];
  const loadError = res.ok ? null : res.error;
  return <LibraryClient initialItems={items} loadError={loadError} />;
}
