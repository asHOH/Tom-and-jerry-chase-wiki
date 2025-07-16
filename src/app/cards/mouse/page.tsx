import { Metadata } from 'next';
import { factionCards } from '@/data';
import MouseCardsClient from './MouseCardsClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '鼠方知识卡 - 猫鼠wiki',
  description: '鼠方知识卡列表，提升老鼠的生存、救援和推奶酪能力',
  keywords: ['鼠方知识卡', '猫和老鼠', '手游', '攻略'],
  openGraph: {
    title: '鼠方知识卡 - 猫鼠wiki',
    description: '鼠方知识卡列表，提升老鼠的生存、救援和推奶酪能力',
    type: 'website',
  },
};

export default function MouseCardsPage() {
  const faction = factionCards['mouse'];

  if (!faction) {
    return <div>Loading...</div>;
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <MouseCardsClient faction={faction} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
