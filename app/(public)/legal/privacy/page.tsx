export const metadata = { title: "سياسة الخصوصيّة" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-content">سياسة الخصوصيّة</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted">
        <p>تحترم لام خصوصيّتك وتلتزم بنظام حماية البيانات الشخصيّة (PDPL) في المملكة العربيّة السعوديّة.</p>
        <p><strong className="text-content">البيانات التي نجمعها:</strong> بيانات الحساب للمهنيّين، وبيانات التواصل التي يدخلها الزوّار طوعًا عند مراسلة مهنيّ.</p>
        <p><strong className="text-content">الاستخدام:</strong> تُستخدم البيانات لتشغيل المنصّة وتمكين التواصل وتحسين الخدمة، ولا تُباع لأطرافٍ ثالثة.</p>
        <p><strong className="text-content">حقوقك:</strong> يحقّ لك الوصول إلى بياناتك وتصحيحها وطلب حذفها وفق النظام.</p>
        <p className="text-sm">هذه نسخةٌ أوّليّة تُراجَع قانونيًّا قبل الإطلاق الرسميّ.</p>
      </div>
    </div>
  );
}
