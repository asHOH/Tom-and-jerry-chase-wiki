import { Metadata } from 'next';
import EntityClient from './EntityGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '衍生物',
  description: '游戏内所有技能衍生物列表。',
  keywords: ['衍生物'],
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
