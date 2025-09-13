import PendingClient from './PendingClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: '待审核文章 - 猫鼠wiki',
    description: '查看猫和老鼠手游文章',
    keywords: ['待审核', '文章', '猫和老鼠', '手游'],
    canonicalUrl: 'https://tjwiki.com/articles/pending',
  }),
  robots: { index: false },
};

export default function PendingModerationPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <PendingClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
