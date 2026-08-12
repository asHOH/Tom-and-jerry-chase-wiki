import type { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { getDocPages } from '@/features/articles/utils/docs';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import { ChevronRightIcon, DocumentTextIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

const DESCRIPTION = '猫和老鼠手游 wiki 操作技巧汇总。';

export const metadata: Metadata = generatePageMetadata({
  title: '文档',
  description: DESCRIPTION,
  keywords: ['文档', '操作技巧', '站点文档'],
  canonicalUrl: `${SITE_URL}/docs`,
  robots: {
    index: true,
    follow: true,
  },
});

export default async function DocsIndexPage() {
  const docPages = await getDocPages();

  return (
    <div className='space-y-8'>
      <PageHeader title='文档' description='欢迎来到猫和老鼠手游维基文档。浏览下面的指南和资源。' />

      {docPages.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {docPages.map((page) => (
            <Card key={page.slug} as='article' bordered interactive className='group p-0'>
              <Link href={page.path} className='block h-full p-6 no-underline'>
                <div className='space-y-3'>
                  <h2 className='text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400'>
                    {page.title}
                  </h2>
                  <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                    <DocumentTextIcon className='mr-2 h-4 w-4' />
                    /docs/{page.slug}
                  </div>
                  <div className='flex items-center text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300'>
                    阅读更多
                    <ChevronRightIcon className='ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1' />
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className='py-12 text-center'>
          <div className='space-y-2 text-gray-500 dark:text-gray-400'>
            <DocumentTextIcon
              className='mx-auto h-16 w-16 text-gray-300 dark:text-gray-600'
              strokeWidth={1}
            />
            <p className='text-lg'>未找到文档页面</p>
            <p className='text-sm'>将 MDX 文件添加到 docs 目录以在此处列出它们。</p>
          </div>
        </div>
      )}
    </div>
  );
}
