import ArticlesClient from './ArticlesClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '文章列表 - 猫鼠wiki',
  description: '浏览和搜索汤姆杰瑞追逐战的文章内容',
  keywords: ['文章', '攻略', '猫和老鼠', '手游'],
  canonicalUrl: 'https://tjwiki.com/articles',
});

export default function ArticlesPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ArticlesClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
