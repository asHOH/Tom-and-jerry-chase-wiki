import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { generateArticleMetadata } from '@/lib/metadataUtils';
import StructuredData from '@/components/StructuredData';
import { modes } from '@/data';

import ModeDetailClient from './ModeDetailsClient';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(modes).map((modeName) => ({
    modeName,
  }));
}

function generateStructuredData(modeName: string) {
  const mode = modes[modeName]!;
  const desc = mode.description ?? `${mode.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${mode.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    image: mode.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/modes/${encodeURIComponent(modeName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modeName: string }>;
}): Promise<Metadata> {
  const modeName = decodeURIComponent((await params).modeName);
  const mode = modes[modeName];

  if (!mode) {
    return {};
  }

  const desc = mode.description ?? `${mode.name}详细信息`;
  return generateArticleMetadata({
    title: mode.name,
    description: desc,
    keywords: [mode.name, '道具'],
    canonicalUrl: `https://tjwiki.com/modes/${encodeURIComponent(modeName)}`,
    imageUrl: mode.imageUrl,
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ modeName: string }>;
}) {
  const modeName = decodeURIComponent((await params).modeName);
  const mode = modes[modeName];

  if (!mode) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(modeName)} />
      <ModeDetailClient mode={mode} />
    </>
  );
}
