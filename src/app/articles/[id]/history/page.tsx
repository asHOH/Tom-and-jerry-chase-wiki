import ArticleHistoryClient from './ArticleHistoryClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';

export default function ArticleHistoryPage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <ArticleHistoryClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
