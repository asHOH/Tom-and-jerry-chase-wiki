import { Metadata } from 'next';
import ItemGroupClient from './ItemGroupGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '道具组',
  description: '站内所有道具组的列表。',
  keywords: ['道具组'],
  canonicalUrl: 'https://tjwiki.com/itemGroups',
});

export default function ItemGroupsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ItemGroupClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
