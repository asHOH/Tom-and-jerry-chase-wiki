import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import StructuredData from '@/components/StructuredData';
import { fixtures } from '@/data';

import FixtureDetailClient from './FixtureDetailsClient';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(fixtures).map((fixtureName) => ({
    fixtureName,
  }));
}

function generateStructuredData(fixtureName: string) {
  const fixture = fixtures[fixtureName]!;
  const desc = fixture.description ?? `${fixture.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${fixture.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    image: fixture.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/fixtures/${encodeURIComponent(fixtureName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fixtureName: string }>;
}): Promise<Metadata> {
  const fixtureName = decodeURIComponent((await params).fixtureName);
  const fixture = fixtures[fixtureName];

  if (!fixture) {
    return {};
  }

  const desc = fixture.description ?? `${fixture.name}详细信息`;
  return generateArticleMetadata({
    title: fixture.name,
    description: desc,
    keywords: [fixture.name, '道具'],
    canonicalUrl: `https://tjwiki.com/fixtures/${encodeURIComponent(fixtureName)}`,
    imageUrl: fixture.imageUrl,
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ fixtureName: string }>;
}) {
  const fixtureName = decodeURIComponent((await params).fixtureName);
  const fixture = fixtures[fixtureName];

  if (!fixture) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(fixtureName)} />
      <FixtureDetailClient fixture={fixture} />
    </>
  );
}
