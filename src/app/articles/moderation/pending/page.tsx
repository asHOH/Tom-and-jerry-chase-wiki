import ModerationPendingClient from './ModerationPendingClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: '内容审核 - 猫鼠wiki',
    description: '审核猫和老鼠手游的文章内容',
    keywords: ['审核', '文章', '猫和老鼠', '手游'],
    canonicalUrl: 'https://tjwiki.com/articles/moderation/pending',
  }),
  robots: { index: false },
};

export default function ModerationPendingPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ModerationPendingClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
