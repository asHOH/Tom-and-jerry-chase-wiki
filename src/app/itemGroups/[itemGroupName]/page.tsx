import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { itemGroups } from '@/data';
import ItemGroupDetailClient from './ItemGroupDetailsClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';
import { getItemGroupImageUrl } from '@/components/displays/itemGroups/itemGroup-grid/getItemGroupImageUrl';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(itemGroups).map((itemGroupName) => ({
    itemGroupName,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemGroupName: string }>;
}): Promise<Metadata> {
  const itemGroupName = decodeURIComponent((await params).itemGroupName);
  const itemGroup = itemGroups[itemGroupName];

  if (!itemGroup) {
    return {};
  }

  const desc = itemGroup.description ?? `${itemGroup.name}详细信息`;
  return generateArticleMetadata({
    title: itemGroup.name,
    description: desc,
    keywords: [itemGroup.name, '道具组'],
    canonicalUrl: `https://tjwiki.com/itemGroups/${encodeURIComponent(itemGroupName)}`,
    imageUrl: getItemGroupImageUrl(itemGroup),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${itemGroup.name} - 猫鼠wiki`,
      description: desc,
      author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://tjwiki.com/itemGroups/${encodeURIComponent(itemGroupName)}`,
      },
    },
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ itemGroupName: string }>;
}) {
  const itemGroupName = decodeURIComponent((await params).itemGroupName);
  const itemGroup = itemGroups[itemGroupName];

  if (!itemGroup) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ItemGroupDetailClient itemGroup={itemGroup} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
