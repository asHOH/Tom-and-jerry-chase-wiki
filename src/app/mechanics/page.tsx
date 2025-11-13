import { Metadata } from 'next';
import MechanicsClient from './MechanicsClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

const DESCRIPTION = '详细介绍游戏内全部的局内机制';

export const metadata: Metadata = generatePageMetadata({
  title: '局内机制',
  description: DESCRIPTION,
  keywords: ['局内机制'],
  canonicalUrl: 'https://tjwiki.com/mechanics',
});

export default function ToolPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <MechanicsClient description={DESCRIPTION} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
