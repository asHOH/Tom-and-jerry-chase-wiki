import { Metadata } from 'next';
import uniq from 'lodash-es/uniq';

import { DEFAULT_KEYWORDS, SITE_SHORT_NAME } from '@/constants/seo';

interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
}: PageMetadata): Metadata {
  const cleanTitle = title.replace(` - ${SITE_SHORT_NAME}`, '');
  const mergedKeywords = uniq([...(keywords || []), ...DEFAULT_KEYWORDS]);
  const metadata: Metadata = {
    title: cleanTitle,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title.includes(SITE_SHORT_NAME) ? title : `${title} - ${SITE_SHORT_NAME}`,
      description,
      type: 'website',
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
  };
}
