import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { items } from '@/data';
import ItemDetailClient from './ItemDetailsClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(items).map((itemName) => ({
    itemName,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemName: string }>;
}): Promise<Metadata> {
  const itemName = decodeURIComponent((await params).itemName);
  const item = items[itemName];

  if (!item) {
    return {};
  }

  const desc = item.description ?? `${item.name}详细信息`;
  return generateArticleMetadata({
    title: item.name,
    description: desc,
    keywords: [item.name, '道具'],
    canonicalUrl: `https://tjwiki.com/items/${encodeURIComponent(itemName)}`,
    imageUrl: item.imageUrl,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${item.name} - 猫鼠wiki`,
      description: desc,
      author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://tjwiki.com/items/${encodeURIComponent(itemName)}`,
      },
    },
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ itemName: string }>;
}) {
  const itemName = decodeURIComponent((await params).itemName);
  const item = items[itemName];

  if (!item) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={true}>
          <ItemDetailClient item={item} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
