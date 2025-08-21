import { Metadata } from 'next';
import { SITE_SHORT_NAME, DEFAULT_KEYWORDS } from '@/constants/seo';

// Basic structure for Schema.org data
interface BaseStructuredData {
  '@context': 'https://schema.org';
  '@type': string;
  inLanguage?: string;
}

// Specific type for list items in a collection
interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  url: string;
}

// Type for an ItemList in a collection page
interface ItemList {
  '@type': 'ItemList';
  numberOfItems: number;
  itemListElement: ListItem[];
}

// Type for CollectionPage structured data
export interface CollectionPageStructuredData extends BaseStructuredData {
  '@type': 'CollectionPage';
  name: string;
  description: string;
  url: string;
  mainEntity: ItemList;
}

// Type for an organization (e.g., author or publisher)
interface Organization {
  '@type': 'Organization';
  name: string;
}

// Type for a WebPage entity
interface WebPage {
  '@type': 'WebPage';
  '@id': string;
}

// Type for Article structured data
export interface ArticleStructuredData extends BaseStructuredData {
  '@type': 'Article';
  headline: string;
  description: string;
  author: Organization;
  publisher: Organization;
  mainEntityOfPage: WebPage;
}

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
  const fullTitle = title.includes(SITE_SHORT_NAME) ? title : `${title} - ${SITE_SHORT_NAME}`;
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
