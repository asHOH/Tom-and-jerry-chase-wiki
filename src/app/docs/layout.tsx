import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import StyledMDX from '@/components/ui/StyledMDX';
import { AppProvider } from '@/context/AppContext';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <TabNavigationWrapper showDetailToggle={false}>
        <div className='container mx-auto'>
          <StyledMDX>{children}</StyledMDX>
        </div>
      </TabNavigationWrapper>
    </AppProvider>
  );
}
