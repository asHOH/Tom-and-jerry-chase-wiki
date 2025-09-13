import PreviewClient from './PreviewClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const metadata: Metadata = generatePageMetadata({
  title: '文章预览 - 猫鼠wiki',
  description: '预览猫和老鼠手游文章',
  keywords: ['预览', '文章', '猫和老鼠', '手游'],
  canonicalUrl: 'https://tjwiki.com/articles/preview',
});

export default function PreviewPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <PreviewClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
