import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { getDocPages } from '@/features/articles/utils/docs';
import DocsSidebar from '@/components/ui/DocsSidebar';
import StyledMDX from '@/components/ui/StyledMDX';

const DESCRIPTION = '猫和老鼠手游 wiki 操作技巧汇总。';

export const metadata: Metadata = generatePageMetadata({
  title: '文档',
  description: DESCRIPTION,
  keywords: ['文档', '操作技巧', '站点文档'],
  canonicalUrl: `${SITE_URL}/docs`,
  robots: {
    index: false,
    follow: true,
  },
});

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
