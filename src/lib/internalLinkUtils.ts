import { SITE_URL } from '@/constants/seo';

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Convert a safe same-site article link to the path format expected by the
 * app's client-side navigation component.
 *
 * Root-relative links are already internal. Absolute links are internal only
 * when their origin matches the configured site origin. Protocol-relative,
 * fragment-only, external, and non-HTTP URLs are intentionally left for the
 * caller to render as regular anchors.
 */
export function getInternalLinkHref(href: string, siteOrigin = SITE_URL): string | null {
  const trimmedHref = href.trim();
  if (!trimmedHref || trimmedHref.startsWith('#') || trimmedHref.startsWith('//')) {
    return null;
  }

  if (trimmedHref.startsWith('/')) {
    return trimmedHref;
  }

  let parsedHref: URL;
  let parsedSiteOrigin: URL;
  try {
    parsedHref = new URL(trimmedHref);
    parsedSiteOrigin = new URL(siteOrigin);
  } catch {
    return null;
  }

  if (!HTTP_PROTOCOLS.has(parsedHref.protocol) || parsedHref.origin !== parsedSiteOrigin.origin) {
    return null;
  }

  return `${parsedHref.pathname}${parsedHref.search}${parsedHref.hash}`;
}
