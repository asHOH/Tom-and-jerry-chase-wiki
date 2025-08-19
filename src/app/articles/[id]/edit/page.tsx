import EditArticleClient from './EditArticleClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';

export default function EditArticlePage() {
  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <EditArticleClient />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
