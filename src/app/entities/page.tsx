import { Metadata } from 'next';
import EntityClient from './EntityGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '道具 - 猫鼠wiki',
  description: '游戏内所有道具列表，包括所有商店道具和部分其它道具。',
  keywords: ['道具', '猫和老鼠', '手游', '攻略'],
  canonicalUrl: 'https://tjwiki.com/entities',
});

export default function EntitysPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <EntityClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
