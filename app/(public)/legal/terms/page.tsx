export const metadata = { title: "الشروط والأحكام" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-content">الشروط والأحكام</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>باستخدامك منصّة لام فإنّك توافق على هذه الشروط. لام منصّة حضورٍ مهنيّ تُسهّل التعريف بالمهنيّين ونشر محتواهم والتواصل معهم.</p>
        <p><strong className="text-content">طبيعة الخدمة:</strong> لام لا تقدّم خدمةً قانونيّة أو مهنيّة، ولا تُعدّ طرفًا في أيّ علاقةٍ بين المهنيّ والجمهور، ولا تقتسم أتعاب المهنيّ.</p>
        <p><strong className="text-content">مسؤوليّة المهنيّ:</strong> المهنيّ مسؤولٌ عن دقّة محتواه والتزامه بأنظمة مهنته وأنظمة الإعلان المعمول بها.</p>
        <p><strong className="text-content">المحتوى:</strong> المحتوى المنشور تعريفيٌّ عامّ وليس استشارة. تحتفظ لام بحقّ مراجعة أو إزالة المحتوى المخالف.</p>
        <p className="text-sm">هذه نسخةٌ أوّليّة تُراجَع قانونيًّا قبل الإطلاق الرسميّ.</p>
      </div>
    </div>
  );
}
