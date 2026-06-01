import { BrandMark } from "@/components/brand-mark";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <BrandMark variant="lawyer" size="lg" />
      <h1 className="text-4xl font-bold">Lawyer ID</h1>
      <p className="text-sm tracking-widest text-muted font-mono">
        SAUDI · LEGAL · COMMERCIAL
      </p>
      <p className="text-base text-muted mt-2">
        منصّة المحتوى القانوني للمحامين السعوديين
      </p>
    </main>
  );
}