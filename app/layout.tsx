import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default:
      "Product Manager Resume Optimizer – Optimize Your PM Resume in 60 Seconds",
    template: "%s | PM Resume Optimizer",
  },
  description:
    "Optimize your product manager resume in 60 seconds using AI. Improve ATS score, match job descriptions, and increase shortlist chances instantly.",
  keywords: [
    "product manager resume",
    "ATS resume optimizer",
    "PM resume keywords",
    "resume optimizer AI",
    "product manager resume builder",
    "resume ATS score improvement",
  ],
  verification: {
    google: "a9CGHtLZZJlKEJZkwjLQcBCGCyp9oR3d9SRLfJ4XXxI",
  },
  openGraph: {
    title: "Optimize Your PM Resume in 60 Seconds",
    description:
      "AI-powered resume optimization for product managers. Improve ATS score and get shortlisted faster.",
    url: "https://pm-resume-optimizer.onrender.com",
    siteName: "PM Resume Optimizer",
    type: "website",
  },
  alternates: {
    canonical: "https://pm-resume-optimizer.onrender.com",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does PM Resume Optimizer work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste your resume and the product manager job description. The AI extracts keywords and rewrites your resume to match the job in under 60 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Is PM Resume Optimizer free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you get free resume optimizations with no credit card required. Premium plans unlock unlimited usage.",
      },
    },
    {
      "@type": "Question",
      name: "Does this help my resume pass ATS systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The tool aligns your resume with job description keywords to improve ATS compatibility and recruiter visibility.",
      },
    },
    {
      "@type": "Question",
      name: "Can I optimize my resume for multiple jobs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Each resume optimization is tailored to a specific job description, and you can generate multiple versions.",
      },
    },
    {
      "@type": "Question",
      name: "Does this work for freshers or aspiring product managers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. It highlights projects, internships, and product thinking to make your resume relevant even without full-time PM experience.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to optimize a resume?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It takes less than 60 seconds to generate an optimized resume tailored to your target job.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can start optimizing without a credit card. Account creation may be required to save or access multiple resumes.",
      },
    },
    {
      "@type": "Question",
      name: "Does it also generate cover letters?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can generate a tailored cover letter based on your resume and job description.",
      },
    },
    {
      "@type": "Question",
      name: "What makes this different from other resume tools?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike generic builders, this tool focuses specifically on product manager roles and optimizes resumes based on real job descriptions in seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Will recruiters notice the difference?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. A keyword-optimized and role-specific resume increases your chances of getting shortlisted and noticed by recruiters.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* FAQ Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        {/* Microsoft Clarity */}
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vwnkhu1a08");
            `,
          }}
        />

        {/* Google Analytics GA4 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-36X2BWZGEP"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-36X2BWZGEP');
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
