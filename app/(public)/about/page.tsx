import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export const metadata = {
  title: "من نحن",
  description: "لام منصّة الحضور المهنيّ السعوديّة: اجعل خبرتك مرئيّة، قابلةً للاكتشاف، وموثوقة.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-content">من نحن</h1>
      <p className="mt-4 leading-relaxed text-muted">
        لام منصّةٌ سعوديّة تساعد المهنيّين — محامين ومستشارين وخبراء وأكاديميّين ومختصّين — على بناء
        حضورٍ رقميٍّ احترافيّ يجعل خبرتهم مرئيّةً وقابلةً للاكتشاف وموثوقة.
      </p>

      <h2 className="mt-10 text-xl font-semibold text-content">ماذا نقدّم</h2>
      <ul className="mt-3 space-y-2 text-muted">
        <li>• صفحة مهنيّة عامّة تُبرز خبرتك ومجالك ومدينتك.</li>
        <li>• نشر محتواك بروابط مهيّأة لمحرّكات البحث.</li>
        <li>• ظهورٌ في البحث وصفحات المجالات والمدن.</li>
        <li>• استقبال طلبات التواصل عبر القناة التي تختارها.</li>
      </ul>

      <h2 className="mt-10 text-xl font-semibold text-content">ما لا نقدّمه</h2>
      <p className="mt-3 leading-relaxed text-muted">
        لام ليست مكتبًا قانونيًّا ولا مقدّم خدمة، ولا تقدّم استشاراتٍ أو آراءً قانونيّة، ولا تتدخّل في
        العلاقة بين المهنيّ وطالب الخدمة، ولا تتقاضى نسبةً من أتعابهم. دورنا تيسير الظهور والتواصل فقط،
        ضمن الأنظمة السعوديّة المنظِّمة للإعلان المهنيّ وحماية البيانات.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/signup" className={buttonClasses("primary", "lg")}>ابدأ مجّانًا</Link>
        <Link href="/legal/terms" className={buttonClasses("ghost", "lg")}>الشروط والأحكام</Link>
        <Link href="/legal/privacy" className={buttonClasses("ghost", "lg")}>سياسة الخصوصيّة</Link>
      </div>
    </div>
  );
}
