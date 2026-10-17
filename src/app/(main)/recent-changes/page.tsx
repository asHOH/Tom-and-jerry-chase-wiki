import type { Metadata } from 'next';

import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';

export const dynamic = 'force-static';

export const metadata: Metadata = generatePageMetadata({
  title: '最近更改',
  description: '查看社区最近通过审核的文章与游戏数据更改',
  keywords: ['最近更改', '编辑记录', '社区贡献'],
  canonicalUrl: getCanonicalUrl('/recent-changes'),
  robots: { index: false },
});

export default function RecentChangesPage() {
  return (
    <PageShell width='narrow' className='py-6'>
      <PageHeader title='最近更改' description='查看社区最近通过审核的文章与游戏数据更改' />
      <Card className='mt-4 space-y-2 p-4 text-sm text-gray-600 dark:text-gray-400'>
        <p>当前为离线静态镜像版本，社区动态（文章与游戏数据更改）需要连接后端服务，暂不可用。</p>
        <p>游戏数据内容（角色、知识卡、道具、状态等）均已完成静态化，可正常浏览。</p>
      </Card>
    </PageShell>
  );
}
