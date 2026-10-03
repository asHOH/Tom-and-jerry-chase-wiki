import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_NAME } from '@/constants/brand';
import { SITE_URL } from '@/constants/seo';
import { getDocPages } from '@/features/articles/utils/docs';
import PageShell from '@/components/ui/PageShell';
import StyledMDX from '@/components/ui/StyledMDX';

import DocsSidebar from './DocsSidebar';

const DESCRIPTION = `${SITE_NAME}操作技巧汇总。`;

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
    <div className='flex min-h-[60vh] min-w-0 flex-col lg:flex-row'>
      <DocsSidebar docPages={docPages} />
      <div className='min-w-0 flex-1'>
        <PageShell width='wide' className='lg:py-4'>
          <StyledMDX>{children}</StyledMDX>
        </PageShell>
      </div>
    </div>
  );
}
