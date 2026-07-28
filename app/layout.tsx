import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import Script from "next/script";
import { DEFAULT_OG_IMAGE, ORGANIZATION_SCHEMA, SITE_NAME, SITE_URL, WEBSITE_SCHEMA, absoluteUrl } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  alternates: { canonical: SITE_URL },
  verification: {
    google: "a9CGHtLZZJlKEJZkwjLQcBCGCyp9oR3d9SRLfJ4XXxI",
  },
  openGraph: {
    title: "Fix Your PM Resume in 60 Seconds",
    description:
      "Find out why your product manager resume isn’t getting interviews and fix it instantly with AI-powered optimization.",
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), alt: `${SITE_NAME} logo` }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fix Your PM Resume in 60 Seconds",
    description:
      "Find out why your product manager resume isn’t getting interviews and fix it instantly with AI-powered optimization.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {[ORGANIZATION_SCHEMA, WEBSITE_SCHEMA].map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
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
