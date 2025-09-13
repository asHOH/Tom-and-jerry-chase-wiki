import ArticleClient from './ArticleClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';

export default function ArticlePage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ArticleClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
