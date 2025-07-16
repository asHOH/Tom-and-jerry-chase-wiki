import { Metadata } from 'next';
import { factionCards } from '@/data';
import KnowledgeCardClient from '../KnowledgeCardClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '鼠方知识卡 - 猫鼠wiki',
  description: '鼠方知识卡列表，提升老鼠的生存、救援和推奶酪能力',
  keywords: ['鼠方知识卡', '猫和老鼠', '手游', '攻略'],
  canonicalUrl: 'https://tjwiki.com/cards/mouse',
});

export default function MouseCardsPage() {
  const faction = factionCards['mouse'];

  if (!faction) {
    return <div>Loading...</div>;
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <KnowledgeCardClient faction={faction} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
