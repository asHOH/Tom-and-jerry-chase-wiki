import { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { CharacterRankingGrid } from '@/components/displays/characters';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '查看所有角色在某项属性上的排名';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: '角色属性排行榜',
    description: DESCRIPTION,
    keywords: ['角色排行榜', '属性', '排名'],
    canonicalUrl: 'https://tjwiki.com/ranks',
  });
}

export default function RanksPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <div className='max-w-7xl mx-auto p-6 space-y-6' style={{ paddingTop: '80px' }}>
            <CharacterRankingGrid description={DESCRIPTION} />
          </div>
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
