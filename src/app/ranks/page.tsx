import { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { CharacterRankingGrid } from '@/components/displays/characters';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: '角色属性排行榜 - 猫鼠wiki',
    description:
      '查看猫和老鼠手游中所有角色在各项属性上的排名对比，包括移速、HP、攻击力等数据分析。',
    keywords: ['角色排行榜', '属性对比', '数据分析', '猫和老鼠', '手游', '攻略'],
    canonicalUrl: 'https://tjwiki.com/ranks',
  });
}

export default function RanksPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <div className='max-w-7xl mx-auto p-6 space-y-6' style={{ paddingTop: '80px' }}>
            <CharacterRankingGrid />
          </div>
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
