import { Metadata } from 'next';
import ItemClient from './ItemGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '在地图中散落的各式各样的道具——猫鼠相互对抗的关键机制';

export const metadata: Metadata = generatePageMetadata({
  title: '道具',
  description: DESCRIPTION,
  keywords: ['道具'],
  canonicalUrl: 'https://tjwiki.com/items',
});

export default function ItemsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ItemClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
