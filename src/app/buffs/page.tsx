import { Metadata } from 'next';
import BuffClient from './BuffGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '状态效果',
  description: '游戏内所有状态效果的列表，包括正面与负面效果。',
  keywords: ['状态', '效果', 'buffs', 'debuffs'],
  canonicalUrl: 'https://tjwiki.com/buffs',
});

export default function BuffsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <BuffClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
