import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import StyledMDX from '@/components/ui/StyledMDX';
import DocsSidebar from '@/components/ui/DocsSidebar';
import { AppProvider } from '@/context/AppContext';
import { getDocPages } from '@/lib/docUtils';

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const docPages = await getDocPages();

  return (
    <AppProvider>
      <TabNavigationWrapper showDetailToggle={false}>
        <div className='flex min-h-screen'>
          <DocsSidebar docPages={docPages} />
          <div className='flex-1 lg:ml-0'>
            <div className='container mx-auto p-6 lg:p-8'>
              <StyledMDX>{children}</StyledMDX>
            </div>
          </div>
        </div>
      </TabNavigationWrapper>
    </AppProvider>
  );
}
