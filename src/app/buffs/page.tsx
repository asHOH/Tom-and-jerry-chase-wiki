import { Metadata } from 'next';
import BuffClient from './BuffGridClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '角色可受到的各类状态效果（该页面建设中）';

export const metadata: Metadata = generatePageMetadata({
  title: '状态效果',
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
