import { Metadata } from 'next';
import uniq from 'lodash-es/uniq';

import { DEFAULT_KEYWORDS, SITE_NAME, SITE_SHORT_NAME, SITE_URL } from '@/constants/seo';

interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  robots?: Metadata['robots'];
  absoluteTitle?: boolean;
}

/**
 * Generates a full canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  robots,
  absoluteTitle = false,
}: PageMetadata): Metadata {
  // Strip existing site suffixes to prevent duplication when the template is applied
  const cleanTitle = title
    .replace(` - ${SITE_SHORT_NAME}`, '')
    .replace(` - ${SITE_NAME}`, '')
    .trim();

  const mergedKeywords = uniq([...(keywords || []), ...DEFAULT_KEYWORDS]);

  const ogTitle = cleanTitle.includes(SITE_SHORT_NAME)
    ? cleanTitle
    : `${cleanTitle} - ${SITE_SHORT_NAME}`;

  const metadata: Metadata = {
    title: absoluteTitle ? { absolute: cleanTitle } : cleanTitle,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots,
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary',
      title: ogTitle,
      description,
    },
  };

  return metadata;
}

export function generateArticleMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  imageUrl,
}: {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  imageUrl?: string;
}): Metadata {
  const base = generatePageMetadata({
    title,
    description,
    keywords,
    canonicalUrl,
  });

  const images = imageUrl
    ? [
        {
          url: imageUrl,
          alt: `${title}封面`,
        },
      ]
    : [];

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      images,
    },
    twitter: {
      ...base.twitter,
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      images,
    },
  };
}
