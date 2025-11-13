import { Metadata } from 'next';
import { mechanicsSectionsList } from '@/components/displays/mechanics/sections';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';
import MechanicsSection from '@/components/displays/mechanics/mechanicsSection';

const DESCRIPTION = '在地图中散落的各式各样的道具——猫鼠相互对抗的关键机制';
const sectionChineseNameList: Record<string, string> = { traitCollection: '特性大全' };

// Generate static params for all special skills
export function generateStaticParams() {
  return Object.keys(mechanicsSectionsList).map((sectionName) => ({
    sectionName,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}): Promise<Metadata> {
  const sectionName = decodeURIComponent((await params).sectionName);
  const sectionChineseName = sectionChineseNameList[sectionName] || '局内机制';

  return generateArticleMetadata({
    title: sectionChineseName,
    description: DESCRIPTION,
    keywords: [sectionChineseName],
    canonicalUrl: `https://tjwiki.com/mechanics/${encodeURIComponent(sectionName)}`,
    //imageUrl:
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: `${sectionChineseName} - 猫鼠wiki`,
      description: DESCRIPTION,
      author: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://tjwiki.com/mechanics/${encodeURIComponent(sectionName)}`,
      },
    },
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}) {
  const sectionName = decodeURIComponent((await params).sectionName);

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={true}>
          <MechanicsSection sectionName={sectionName} description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
