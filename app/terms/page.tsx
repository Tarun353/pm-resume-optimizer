import type { Metadata } from 'next';
import Link from 'next/link';
import { SeoCta } from '@/components/SeoCta';

export const metadata: Metadata = {
  title: 'Terms of Service | PM Resume Optimizer',
  description: 'Read the PM Resume Optimizer terms covering AI-generated content, payments, usage limits, and service responsibilities.',
  keywords: ['PM Resume Optimizer terms', 'resume optimization terms of service', 'AI resume tool terms'],
};

export const metadata: Metadata = {
  title: 'Terms of Service | PM Resume Optimizer',
  description: 'Read the PM Resume Optimizer terms covering AI-generated content, payments, usage limits, and service responsibilities.',
  keywords: ['PM Resume Optimizer terms', 'resume optimization terms of service', 'AI resume tool terms'],
};

export default function TermsPage() {
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
        <SeoCta className="mb-8" />
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8 text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">1. Acceptance of terms</h2>
            <p className="leading-relaxed text-sm">By accessing or using PM Resume Optimizer ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">2. What the Service does</h2>
            <p className="leading-relaxed text-sm mb-3">PM Resume Optimizer is an AI-powered tool that helps Product Managers improve their resumes. Specifically, it:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li>Analyses your resume against a job description for ATS keyword alignment</li>
              <li>Rewrites your resume summary and bullet points to better match the role</li>
              <li>Generates a tailored cover letter based on your resume and the job description</li>
              <li>Allows you to edit, preview, and download your resume as a PDF</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">3. User responsibilities</h2>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li><strong>Accuracy:</strong> You are responsible for ensuring the information in your resume is accurate. The Service helps you present your experience more effectively — it does not verify facts.</li>
              <li><strong>Review output:</strong> AI-generated content may contain errors or suggestions that are not appropriate for your specific situation. Always review the output before using it in a job application.</li>
              <li><strong>Lawful use:</strong> You agree not to use the Service to create misleading or fraudulent resumes, or for any purpose that violates applicable law.</li>
              <li><strong>Account security:</strong> You are responsible for keeping your account credentials secure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">4. Free tier and paid plans</h2>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li>Free accounts receive 5 resume optimizations and 5 resume analyses at no cost.</li>
              <li>Paid plans provide unlimited access for a defined period (1 day, 10 days, or 30 days from activation).</li>
              <li>Paid plan access begins immediately upon successful payment confirmation.</li>
              <li>Plans do not auto-renew. Once the period expires, you return to free tier limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">5. Payments and refunds</h2>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li>All payments are processed securely through Razorpay in Indian Rupees (INR).</li>
              <li>Payment confirmation is required before paid access is activated.</li>
              <li><strong>Refund policy:</strong> If you experience a technical issue that prevents you from using the Service after payment, contact us within 48 hours and we will review your request. Refunds are issued at our discretion for legitimate technical failures.</li>
              <li>Refunds are not available for change-of-mind purchases once access has been activated.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">6. AI-generated content</h2>
            <p className="leading-relaxed text-sm mb-3">The Service uses artificial intelligence to generate resume content. Important limitations to understand:</p>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed">
              <li>AI output is suggestions, not guarantees of job placement or interview callbacks.</li>
              <li>The Service does not guarantee that your resume will pass any specific ATS system, as ATS configurations vary by company.</li>
              <li>You retain full ownership of your resume content. The AI-generated suggestions are provided for your use without restriction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">7. Intellectual property</h2>
            <p className="leading-relaxed text-sm">The PM Resume Optimizer platform, including its design, code, and non-user-generated content, is owned by us and protected by applicable intellectual property laws. You may not copy, reproduce, or create derivative works of our platform without written permission.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">8. Limitation of liability</h2>
            <p className="leading-relaxed text-sm">The Service is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including any decisions made based on AI-generated resume content. Our total liability for any claim shall not exceed the amount you paid for the Service in the preceding 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">9. Termination</h2>
            <p className="leading-relaxed text-sm">We reserve the right to suspend or terminate accounts that violate these Terms. You may stop using the Service at any time. Upon termination, your right to access paid features ends immediately, and we will handle your data in accordance with our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">10. Changes to terms</h2>
            <p className="leading-relaxed text-sm">We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance. We will update the "Last updated" date at the top of this page when changes are made.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-3">11. Contact</h2>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-slate-900">PM Resume Optimizer</p>
              <p className="text-slate-600 mt-1">WhatsApp / Phone: +91 6200825883</p>
              <p className="text-slate-500 text-xs mt-1">We typically respond within 24 hours on working days.</p>
            </div>
          </section>

        </div>

        <SeoCta className="mt-10" />

        <div className="mt-12 pt-8 border-t border-slate-200 flex gap-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700 transition-colors">← Back to Home</Link>
          <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy →</Link>
        </div>
      </main>
    </div>
  );
}
