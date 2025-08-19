import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { entities } from '@/data';
import EntityDetailClient from './EntityDetailsClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';

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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `${entity.name} - 猫鼠wiki`,
    description: entity.description,
    image: entity.imageUrl,
  };

  return {
    title: `${entity.name} - 猫鼠wiki`,
    description: entity.description,
    keywords: [entity.name, '道具', '猫和老鼠', '手游', '攻略'],
    openGraph: {
      title: `${entity.name} - 猫鼠wiki`,
      description: entity.description,
      images: entity.imageUrl
        ? [
            {
              url: entity.imageUrl,
              alt: `${entity.name}道具图标`,
            },
          ]
        : [],
      type: 'article',
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
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
