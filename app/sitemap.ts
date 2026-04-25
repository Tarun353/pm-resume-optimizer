import type { MetadataRoute } from 'next';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://pm-resume-optimizer.onrender.com';
const APP_DIR = path.join(process.cwd(), 'app');

// Add manual dynamic routes here when needed, e.g. '/blog/my-post'
const dynamicRoutes: string[] = [];

function isRoutableSegment(segment: string) {
  // Skip route groups, parallel routes, and dynamic/catch-all segments
  return (
    segment !== 'api' &&
    !segment.startsWith('(') &&
    !segment.startsWith('@') &&
    !segment.includes('[')
  );
}

function discoverRoutes(dir: string, routePrefix = ''): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const routes = new Set<string>();

  const hasPage = entries.some(
    (entry) =>
      entry.isFile() &&
      /^page\.(js|jsx|ts|tsx|mdx)$/.test(entry.name),
  );

  if (hasPage) {
    routes.add(routePrefix || '/');
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || !isRoutableSegment(entry.name)) {
      continue;
    }

    const childDir = path.join(dir, entry.name);
    const childPrefix = `${routePrefix}/${entry.name}`.replace(/\/+/g, '/');

    for (const route of discoverRoutes(childDir, childPrefix)) {
      routes.add(route);
    }
  }

  return Array.from(routes);
}

function normalizeRoute(route: string): string {
  if (!route || route === '/') {
    return '/';
  }

  const normalized = route.startsWith('/') ? route : `/${route}`;
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

function getSeoMetadata(route: string) {
  if (route === '/') {
    return { changeFrequency: 'weekly' as const, priority: 1.0 };
  }

  if (route === '/privacy' || route === '/terms') {
    return { changeFrequency: 'yearly' as const, priority: 0.3 };
  }

  return { changeFrequency: 'monthly' as const, priority: 0.7 };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const discoveredRoutes = discoverRoutes(APP_DIR);
  const routes = Array.from(
    new Set([...discoveredRoutes, ...dynamicRoutes].map(normalizeRoute)),
  );

  return routes
    .sort((a, b) => a.localeCompare(b))
    .map((route) => {
      const { changeFrequency, priority } = getSeoMetadata(route);

      return {
        url: route === '/' ? BASE_URL : `${BASE_URL}${route}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
      };
    });
}
