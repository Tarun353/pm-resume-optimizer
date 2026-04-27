import Link from 'next/link';
import { SeoCta } from '@/components/SeoCta';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, BLOG_POST_BY_SLUG } from '@/lib/content/blogPosts';

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POST_BY_SLUG[slug];

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const canonical = `https://pm-resume-optimizer.onrender.com/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: canonical,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = BLOG_POST_BY_SLUG[slug];

  if (!post) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'PM Resume Optimizer',
    },
    publisher: {
      '@type': 'Organization',
      name: 'PM Resume Optimizer',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://pm-resume-optimizer.onrender.com/blog/${post.slug}`,
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />

        <p className="text-sm font-medium text-blue-700">{post.readTime}</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-6 text-base leading-8 text-slate-700">{post.description}</p>

        {post.sections.map((section) => (
          <section key={section.heading} className="mt-10">
            <h2 className="text-2xl font-semibold text-slate-900">{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={`${section.heading}-${index}`} className="mt-4 text-base leading-8 text-slate-700">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Ready to improve your PM resume?</h2>
          <p className="mt-3 text-slate-700">
            Run your resume through PM Resume Optimizer to get ATS feedback, keyword gap analysis,
            and tailored bullet rewrites in under 60 seconds.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Check your ATS score →
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse More Guides
            </Link>
          </div>
        </section>

        <SeoCta className="mt-10" />
      </article>
    </main>
  );
}
