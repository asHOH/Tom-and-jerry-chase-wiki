import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { entities } from '@/data';
import EntityDetailClient from './EntityDetailsClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(entities).map((entityName) => ({
    entityName,
  }));
}

//以下代码复制自Item，由于entities的数据结构与items不同故增加了allentities用于拆解，不知是否合适
const allentities = { ...entities['cat'], ...entities['mouse'] };
export async function generateMetadata({
  params,
}: {
  params: Promise<{ entityName: string }>;
}): Promise<Metadata> {
  const entityName = decodeURIComponent((await params).entityName);
  const entity = allentities[entityName];

  if (!entity) {
    return {};
  }

  const desc = entity.description ?? `${entity.name}详细信息`;
  return generateArticleMetadata({
    title: entity.name,
    description: desc,
    keywords: [entity.name, '衍生物'],
    canonicalUrl: `https://tjwiki.com/entities/${encodeURIComponent(entityName)}`,
    imageUrl: entity.imageUrl,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${entity.name} - 猫鼠wiki`,
      description: desc,
      author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://tjwiki.com/entities/${encodeURIComponent(entityName)}`,
      },
    },
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ entityName: string }>;
}) {
  const entityName = decodeURIComponent((await params).entityName);
  const entity = allentities[entityName];

  if (!entity) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={true}>
          <EntityDetailClient entity={entity} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
