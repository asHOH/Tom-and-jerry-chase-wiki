import { Metadata } from 'next';
import ItemGroupClient from './ItemGroupGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '列举目前支持的所有组合';

export const metadata: Metadata = generatePageMetadata({
  title: '组合',
  description: DESCRIPTION,
  keywords: ['组合'],
  canonicalUrl: 'https://tjwiki.com/itemGroups',
});

export default function ItemGroupsPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ItemGroupClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
