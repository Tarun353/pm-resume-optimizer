import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | PM Resume Optimizer',
  description: 'Review how PM Resume Optimizer handles account data, resume processing, analytics, and security practices.',
  keywords: ['PM Resume Optimizer privacy policy', 'resume data privacy', 'ATS resume tool privacy'],
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">PM</div>
            <span className="font-bold text-slate-900">PM Resume Optimizer</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8 text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. What we collect</h2>
            <p className="leading-relaxed mb-3">When you use PM Resume Optimizer, we collect the minimum information needed to provide our service:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li><strong>Account information:</strong> Your name and email address from Google Sign-In. We do not store passwords.</li>
              <li><strong>Usage data:</strong> Number of resume optimizations, analyses, and downloads you have used (to enforce free tier limits and paid plan access).</li>
              <li><strong>Payment data:</strong> Payment status and plan type. We do not store card numbers, UPI IDs, or any payment credentials — these are handled entirely by Razorpay.</li>
              <li><strong>Resume content:</strong> The text you paste or upload is processed in memory to generate results. See Section 2 for details on how this is handled.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. Your resume data</h2>
            <p className="leading-relaxed mb-3">This is the most important section. Here is exactly what happens to your resume text:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li><strong>Not stored:</strong> Your resume text is never saved to our database. It exists only in server memory during the time it takes to generate your results.</li>
              <li><strong>Not shared:</strong> Your resume is never shared with third parties for marketing or data purposes.</li>
              <li><strong>AI processing:</strong> Your resume text is sent to AI language model APIs to generate optimization suggestions. This is necessary to provide the service. These APIs process your data under their own privacy policies and do not use your data to train their models.</li>
              <li><strong>PDF generation:</strong> When you download a PDF, it is generated in memory and sent directly to your browser. No copy is stored on our servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. How we use your information</h2>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li>To provide and improve the resume optimization service</li>
              <li>To manage your account and track your usage against free/paid tier limits</li>
              <li>To process payments and activate paid subscriptions</li>
              <li>To respond to support requests you send us</li>
              <li>To send service-related communications (not marketing emails)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Cookies and analytics</h2>
            <p className="leading-relaxed text-sm">We use Google Analytics (GA4) and Microsoft Clarity to understand how users interact with our product. These tools collect anonymized usage patterns such as pages visited and features used. They do not have access to your resume content. You can opt out of Google Analytics using browser extensions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Data retention</h2>
            <p className="leading-relaxed text-sm">Account information (name, email, usage counts) is retained while your account is active. If you request account deletion, we will remove your account data within 7 business days. Resume content is never retained beyond the active session.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. Your rights</h2>
            <p className="leading-relaxed mb-3 text-sm">You have the right to:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated data</li>
              <li>Withdraw consent at any time by discontinuing use of the service</li>
            </ul>
            <p className="mt-3 text-sm">To exercise any of these rights, contact us at the details in Section 8.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Security</h2>
            <p className="leading-relaxed text-sm">We use industry-standard security practices including HTTPS encryption for all data in transit, Supabase for secure database management, and server-side processing to ensure resume data never passes through unsecured channels. Payment processing is handled entirely by Razorpay, a PCI-DSS compliant payment gateway.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Contact</h2>
            <p className="leading-relaxed text-sm">For any privacy-related questions, requests, or concerns, please contact us at:</p>
            <div className="mt-3 bg-white border border-slate-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-slate-900">PM Resume Optimizer</p>
              <p className="text-slate-600 mt-1">WhatsApp / Phone: +91 6200825883</p>
              <p className="text-slate-500 text-xs mt-1">We typically respond within 24 hours on working days.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Changes to this policy</h2>
            <p className="leading-relaxed text-sm">We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. Continued use of the service after changes constitutes acceptance of the revised policy.</p>
          </section>

        </div>


        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700 transition-colors">← Back to Home</Link>
          <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms of Service →</Link>
        </div>
      </main>
    </div>
  );
}
