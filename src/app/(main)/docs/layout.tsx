import { getDocPages } from '@/lib/docUtils';
import DocsSidebar from '@/components/ui/DocsSidebar';
import StyledMDX from '@/components/ui/StyledMDX';

export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const docPages = await getDocPages();

  return (
    <div className='flex min-h-screen'>
      <DocsSidebar docPages={docPages} />
      <div className='flex-1 lg:ml-0'>
        <div className='container mx-auto p-6 lg:p-8'>
          <StyledMDX>{children}</StyledMDX>
        </div>
      </div>
    </div>
  );
}
