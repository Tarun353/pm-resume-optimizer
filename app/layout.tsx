import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PM Resume Optimizer — Tailor Your Resume to Any PM Job in 60 Seconds",
  description:
    "AI resume optimizer for Product Managers. Paste your resume + PM job description → get ATS-optimized, keyword-matched resume instantly. Free for aspiring PMs, experienced PMs, and career switchers. No credit card needed.",
  keywords:
    "PM resume optimizer, product manager resume, ATS resume optimizer, resume for product manager, PM job application, product manager resume builder, aspiring PM resume, PM resume keywords",
  verification: {
    google: "a9CGHtLZZJlKEJZkwjLQcBCGCyp9oR3d9SRLfJ4XXxI",
  },
  openGraph: {
    title: "PM Resume Optimizer — Land More PM Interviews",
    description:
      "Optimize your PM resume for any job description in 60 seconds. ATS-friendly, keyword-matched, free to try.",
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
      name: "How does PM Resume Optimizer work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Paste your resume and the PM job description. Our AI analyzes the JD, extracts relevant keywords, and rewrites your summary and bullet points to match — in under 60 seconds.",
      },
    },
    {
      "@type": "Question",
      name: "Is PM Resume Optimizer free?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You get 5 free resume optimizations with no credit card required. Premium plans start at ₹49 for unlimited access.",
      },
    },
    {
      "@type": "Question",
      name: "Does this work for aspiring Product Managers with no experience?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We have a dedicated mode for aspiring PMs that emphasizes internships, projects, hackathons, and product thinking over formal work experience.",
      },
    },
    {
      "@type": "Question",
      name: "Will this help my resume pass ATS systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our optimizer injects relevant keywords from the job description into your resume contextually, which improves ATS keyword matching while keeping the resume readable for human reviewers.",
      },
    },
    {
      "@type": "Question",
      name: "Can I optimize my resume for multiple PM jobs?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Each optimization is specific to one job description. With a premium plan you can optimize for unlimited roles.",
      },
    },
    {
      "@type": "Question",
      name: "Does it also generate cover letters?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. After optimizing your resume, you can generate a tailored cover letter for the same role with one click.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
