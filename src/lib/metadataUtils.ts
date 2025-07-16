import { Metadata } from 'next';

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
  const metadata: Metadata = {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
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
