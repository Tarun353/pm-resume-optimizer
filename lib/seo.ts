import type { Metadata } from 'next';

export const SITE_URL = 'https://pm-resume-optimizer.onrender.com';
export const SITE_NAME = 'PM Resume Optimizer';
export const DEFAULT_OG_IMAGE = '/icon.svg';

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedPath === '/' ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}

type SeoMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  type = 'website',
  publishedTime,
  modifiedTime,
}: SeoMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const image = absoluteUrl(DEFAULT_OG_IMAGE);

  const metadata: Metadata = {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, alt: `${SITE_NAME} logo` }],
      type,
      ...(type === 'article'
        ? {
            publishedTime,
            modifiedTime: modifiedTime ?? publishedTime,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };

  return metadata;
}

export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl(DEFAULT_OG_IMAGE),
  sameAs: [
    'https://www.instagram.com/pmresumeoptimizer/',
    'https://www.reddit.com/user/PM-RESUME-OPTIMIZER/',
    'https://x.com/pmresumeai',
    'https://www.linkedin.com/company/pm-resume-optimizer/about/',
  ],
};

export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/blog?query={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export function createBreadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
