export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
      <p className="text-sm text-slate-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="space-y-4 text-sm leading-6">
        <p>We collect only the information needed to provide resume optimization, account access, and download tracking.</p>
        <p>Your uploaded/pasted resume content is used to generate requested outputs and improve product reliability.</p>
        <p>We do not sell personal information. You can contact support to request deletion of account-related data.</p>
      </div>
    </main>
  );
}
