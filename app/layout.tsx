import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PM Resume Optimizer — Tailor Your Resume to Any PM Job in 60 Seconds",
  description: "Free AI-powered resume optimizer built for Product Managers. Paste your resume + any PM job description and get an ATS-optimized, keyword-matched resume instantly. For aspiring PMs, experienced PMs, and career switchers.",
  keywords: "PM resume optimizer, product manager resume, ATS resume optimizer, resume for product manager, PM job application, product manager resume builder",
  verification: {
    google: "a9CGHtLZZJlKEJZkwjLQcBCGCyp9oR3d9SRLfJ4XXxI",
  },
  openGraph: {
    title: "PM Resume Optimizer",
    description: "Optimize your PM resume for any job description in 60 seconds. ATS-friendly, keyword-matched, free to try.",
    siteName: "PM Resume Optimizer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
