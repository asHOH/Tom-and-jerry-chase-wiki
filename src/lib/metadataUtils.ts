import { Metadata } from 'next';
import { SITE_SHORT_NAME, DEFAULT_KEYWORDS } from '@/constants/seo';
import { WithContext, Article, CollectionPage } from 'schema-dts';

/**
 * @deprecated Use `WithContext<CollectionPage>` directly instead.
 */
export type CollectionPageStructuredData = WithContext<CollectionPage>;

/**
 * @deprecated Use `WithContext<Article>` directly instead.
 */
export type ArticleStructuredData = WithContext<Article>;

// Union type for all supported structured data formats
type StructuredData = CollectionPageStructuredData | ArticleStructuredData;

interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  structuredData?: StructuredData; // Use the specific union type here
}

export function generatePageMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  structuredData,
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

  if (structuredData) {
    metadata.other = {
      'application/ld+json': JSON.stringify(structuredData),
    };
  }

  return metadata;
}

export function generateArticleMetadata({
  title,
  description,
  keywords = [],
  canonicalUrl,
  imageUrl,
  structuredData,
}: {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  imageUrl?: string;
  structuredData?: StructuredData;
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
    ...(structuredData
      ? {
          other: {
            'application/ld+json': JSON.stringify(structuredData),
          },
        }
      : {}),
  };
}

export function buildArticleStructuredData({
  title,
  description,
  canonicalUrl,
  inLanguage = 'zh-CN',
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  inLanguage?: string;
}): ArticleStructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    inLanguage,
  };
}
