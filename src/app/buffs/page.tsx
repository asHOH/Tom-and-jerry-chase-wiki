import { Metadata } from 'next';
import BuffClient from './BuffGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION =
  '游戏内的全部状态和效果。状态是一或多种效果的结合，效果具有单一不可再分的特定作用。部分效果本身也是一种状态。（该页面建设中）';

export const metadata: Metadata = generatePageMetadata({
  title: '状态和效果',
  description: DESCRIPTION,
  keywords: ['状态', '效果', 'buffs', 'debuffs'],
  canonicalUrl: 'https://tjwiki.com/buffs',
});

export default function BuffsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <BuffClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
