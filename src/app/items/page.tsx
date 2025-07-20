import { Metadata } from 'next';
import ItemClient from './ItemClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '道具 - 猫鼠wiki',
  // TODO: refine the description
  description: '道具列表，提升猫击倒、放飞老鼠的能力与老鼠生存、救援的能力',
  keywords: ['道具', '猫和老鼠', '手游', '攻略'],
  canonicalUrl: 'https://tjwiki.com/items',
});

export default function ItemsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ItemClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
