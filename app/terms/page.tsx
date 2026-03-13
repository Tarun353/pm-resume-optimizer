export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-slate-800">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Terms of Service</h1>
      <p className="text-sm text-slate-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="space-y-4 text-sm leading-6">
        <p>By using ResumeForge, you agree to use the service responsibly and provide accurate information when generating resumes and cover letters.</p>
        <p>Your use of AI-generated content is at your own discretion. Please review all generated documents before downloading or sharing.</p>
        <p>We may update these terms over time. Continued use of the service means you accept the updated terms.</p>
      </div>
    </main>
  );
}
