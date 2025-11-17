import { Metadata } from 'next';
import { SITE_SHORT_NAME, DEFAULT_KEYWORDS } from '@/constants/seo';

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
  const fullTitle = title.includes(SITE_SHORT_NAME) ? title : `${title}`;
  const mergedKeywords = Array.from(new Set([...(keywords || []), ...DEFAULT_KEYWORDS]));
  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
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
