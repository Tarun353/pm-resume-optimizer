import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default:
      "Product Manager Resume Optimizer – Fix & Tailor Your PM Resume in 60 Seconds",
    template: "%s | PM Resume Optimizer",
  },
  description:
    "Know exactly why your product manager resume gets rejected and fix it instantly. Get ATS-optimized, job-tailored PM resumes in 60 seconds using AI.",
  keywords: [
    "product manager resume",
    "ATS resume optimizer",
    "PM resume keywords",
    "resume optimizer AI",
    "product manager resume builder",
    "resume ATS score improvement",
    "PM job resume tips",
  ],
  verification: {
    google: "a9CGHtLZZJlKEJZkwjLQcBCGCyp9oR3d9SRLfJ4XXxI",
  },
  openGraph: {
    title: "Fix Your PM Resume in 60 Seconds",
    description:
      "Find out why your product manager resume isn’t getting interviews and fix it instantly with AI-powered optimization.",
    url: "https://pm-resume-optimizer.onrender.com",
    siteName: "PM Resume Optimizer",
    type: "website",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is my product manager resume not getting interviews?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most PM resumes fail because they lack measurable impact, product thinking, and keyword alignment with job descriptions. This tool identifies exactly where your resume is weak and helps fix it.",
      },
    },
    {
      "@type": "Question",
      name: "How does PM Resume Optimizer work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste your resume and a product manager job description. The AI analyzes your resume for ATS compatibility and recruiter expectations, then rewrites it to match the role in under 60 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Does this help my resume pass ATS systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. It aligns your resume with job-specific keywords and improves formatting so it performs better in applicant tracking systems.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from other resume tools?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike generic resume builders, this tool is built specifically for product manager roles and focuses on impact-driven bullet points, metrics, and product ownership language.",
      },
    },
    {
      "@type": "Question",
      name: "Can I tailor my resume for multiple PM job roles?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can generate multiple tailored versions of your resume for different job descriptions instantly.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to optimize a resume?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "It takes less than 60 seconds to generate a job-specific, optimized resume.",
      },
    },
    {
      "@type": "Question",
      name: "Does this work for aspiring product managers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. It helps highlight projects, internships, and transferable skills in a way that aligns with PM expectations.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can start without a credit card. Creating an account allows you to save and manage multiple resume versions.",
      },
    },
    {
      "@type": "Question",
      name: "Does it also generate cover letters?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can generate tailored cover letters based on your resume and job description.",
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
