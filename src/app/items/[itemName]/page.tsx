import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { items } from '@/data';
import ItemDetailClient from './ItemDetailClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';

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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `${item.name} - 猫鼠wiki`,
    description: item.description,
    image: item.imageUrl,
  };

  return {
    title: `${item.name} - 猫鼠wiki`,
    description: item.description,
    keywords: [item.name, '道具', '猫和老鼠', '手游', '攻略'],
    openGraph: {
      title: `${item.name} - 猫鼠wiki`,
      description: item.description,
      images: item.imageUrl
        ? [
            {
              url: item.imageUrl,
              alt: `${item.name}道具图标`,
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
