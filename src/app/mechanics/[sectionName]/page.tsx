import { Metadata } from 'next';
import { mechanicsSectionsList } from '@/components/displays/mechanics/sections';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { generateArticleMetadata } from '@/lib/metadataUtils';
import MechanicsSection from '@/components/displays/mechanics/mechanicsSection';
import { notFound } from 'next/navigation';

const DESCRIPTION = '详细介绍游戏内的局内机制（该界面建设中）';
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
  const isEffectiveSection = mechanicsSectionsList.find((name) => name === sectionName);
  if (!isEffectiveSection) {
    return {};
  }
  const sectionChineseName = sectionChineseNameList[sectionName] || '局内机制';

  return generateArticleMetadata({
    title: sectionChineseName,
    description: DESCRIPTION,
    keywords: [sectionChineseName],
    canonicalUrl: `https://tjwiki.com/mechanics/${encodeURIComponent(sectionName)}`,
  });
}

export default async function SpecialSkillDetailPage({
  params,
}: {
  params: Promise<{ sectionName: string }>;
}) {
  const sectionName = decodeURIComponent((await params).sectionName);
  const isEffectiveSection = mechanicsSectionsList.find((name) => name === sectionName);
  if (!isEffectiveSection) {
    notFound();
  }

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
