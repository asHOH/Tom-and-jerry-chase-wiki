import { Metadata } from 'next';
import { factionCards } from '@/data';
import CatCardsClient from './CatCardsClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '猫方知识卡 - 猫鼠wiki',
  description: '猫方知识卡列表，提升猫击倒和放飞老鼠的能力',
  keywords: ['猫方知识卡', '猫和老鼠', '手游', '攻略'],
  openGraph: {
    title: '猫方知识卡 - 猫鼠wiki',
    description: '猫方知识卡列表，提升猫击倒和放飞老鼠的能力',
    type: 'website',
  },
};

export default function CatCardsPage() {
  const faction = factionCards['cat'];

  if (!faction) {
    return <div>Loading...</div>;
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <CatCardsClient faction={faction} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
