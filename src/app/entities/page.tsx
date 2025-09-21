import { Metadata } from 'next';
import EntityClient from './EntityGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '由角色技能衍生出的独立物体，各自拥有独特的作用（该界面更新中）';

export const metadata: Metadata = generatePageMetadata({
  title: '衍生物',
  description: DESCRIPTION,
  keywords: ['衍生物'],
  canonicalUrl: 'https://tjwiki.com/entities',
});

export default function EntitysPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <EntityClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
