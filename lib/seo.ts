export const SITE_URL = 'https://pm-resume-optimizer.onrender.com';

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedPath === '/' ? SITE_URL : `${SITE_URL}${normalizedPath}`;
}
