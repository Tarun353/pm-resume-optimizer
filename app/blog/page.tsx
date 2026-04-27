import Link from 'next/link';
import { SeoCta } from '@/components/SeoCta';
import type { Metadata } from 'next';
import { BLOG_POSTS } from '@/lib/content/blogPosts';

export const metadata: Metadata = {
  title: 'PM Resume Blog: Guides, ATS Tips, and Keyword Strategies',
  description:
    'Read practical product manager resume guides, ATS optimization tips, and role-specific keyword strategies to improve your PM interview conversion.',
  keywords: ['PM resume blog', 'ATS resume tips', 'product manager resume keywords'],
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          PM Resume Blog
        </h1>
        <p className="mt-4 text-slate-700">
          Actionable guides to improve your product manager resume, pass ATS
          screening, and land more interviews.
        </p>
        <SeoCta className="mt-5" />

        <div className="mt-10 grid gap-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                {post.readTime}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {post.title}
              </h2>
              <p className="mt-3 text-slate-700">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-5 inline-flex items-center text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>

        <SeoCta className="mt-10" />
      </div>
    </main>
  );
}
