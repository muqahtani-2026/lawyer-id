export const metadata = { title: "إخلاء المسؤوليّة" };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-content">إخلاء المسؤوليّة</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>جميع المحتويات والإجابات المنشورة على لام ذات طابعٍ تعريفيٍّ عامّ، وليست استشارةً قانونيّة أو مهنيّة، ولا تُغني عن الرجوع إلى مختصٍّ للحصول على رأيٍ مخصّص لحالتك.</p>
        <p>لام تُسهّل التعريف بالمهنيّين والتواصل معهم، ولا تقدّم الخدمة المهنيّة بنفسها، ولا تتحمّل مسؤوليّة أيّ اتّفاقٍ أو خدمةٍ تتمّ بين المهنيّ والجمهور.</p>
        <p>المهنيّ وحده مسؤولٌ عن الخدمة التي يقدّمها والتزامه بأنظمة مهنته.</p>
      </div>
    </div>
  );
}
