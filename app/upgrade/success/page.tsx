const CSS = `
.us-root{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a192f;color:#e6f1ff;direction:rtl;font-family:'IBM Plex Sans Arabic',system-ui,sans-serif;padding:24px}
.us-card{width:100%;max-width:400px;background:#0f1f3d;border:1px solid #1d3461;border-radius:18px;padding:34px 28px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.us-ic{width:56px;height:56px;border-radius:50%;background:#10331f;border:1px solid #4ade80;color:#4ade80;display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px}
.us-h1{font-family:'Readex Pro',sans-serif;font-size:21px;font-weight:600;margin:0 0 8px}
.us-p{font-size:13.5px;color:#8892b0;line-height:1.8;margin:0 0 22px}
.us-btn{width:100%;border:none;border-radius:12px;padding:13px;font-size:14.5px;font-weight:600;font-family:inherit;color:#0a192f;background:#4a9eff;cursor:pointer}
`;

export default function UpgradeSuccessPage() {
  return (
    <div className="us-root">
      <style>{CSS}</style>
      <div className="us-card">
        <div className="us-ic">✓</div>
        <h1 className="us-h1">تمّ تفعيل اشتراك Pro</h1>
        <p className="us-p">
          حسابك الآن على باقة Pro — يمكنك النشر التلقائيّ، رفع ملفّاتك، وجدولة المحتوى.
        </p>
        <form action="/profile" method="get">
          <button type="submit" className="us-btn">العودة إلى لوحتي</button>
        </form>
      </div>
    </div>
  );
}
