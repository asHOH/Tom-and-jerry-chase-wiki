import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { buffs } from '@/data';
import BuffDetailClient from './BuffDetailsClient';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';
import { Article, WithContext } from 'schema-dts';
import StructuredData from '@/components/StructuredData';

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(buffs).map((buffName) => ({
    buffName,
  }));
}

function generateStructuredData(buffName: string): WithContext<Article> | null {
  const buff = buffs[buffName];

  if (!buff) {
    return null;
  }

  const desc = buff.description ?? `${buff.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${buff.name} - 猫鼠wiki`,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/buffs/${encodeURIComponent(buffName)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ buffName: string }>;
}): Promise<Metadata> {
  const buffName = decodeURIComponent((await params).buffName);
  const buff = buffs[buffName];

  if (!buff) {
    return {};
  }

  const desc = buff.description ?? `${buff.name}详细信息`;
  return generateArticleMetadata({
    title: buff.name,
    description: desc,
    keywords: [buff.name, '状态'],
    canonicalUrl: `https://tjwiki.com/buffs/${encodeURIComponent(buffName)}`,
    imageUrl: buff.imageUrl,
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ buffName: string }>;
}) {
  const buffName = decodeURIComponent((await params).buffName);
  const buff = buffs[buffName];

  if (!buff) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={true}>
          <StructuredData data={generateStructuredData(buffName)} />
          <BuffDetailClient buff={buff} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
