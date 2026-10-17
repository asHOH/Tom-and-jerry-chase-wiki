import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';

/**
 * 静态跳转页：用 meta refresh 实现（静态导出环境下 redirect() 不可用）。
 */
export default function StaticRedirect({ url, title }: { url: string; title?: string }) {
  return (
    <>
      <meta httpEquiv='refresh' content={`0; url=${encodeURI(url)}`} />
      <PageShell width='narrow' className='py-6'>
        <PageHeader title={title ?? '正在跳转'} />
        <p className='text-gray-600 dark:text-gray-400'>
          如果页面没有自动跳转，请
          <a href={url} className='text-blue-600 underline dark:text-blue-400'>
            点击这里
          </a>
          。
        </p>
      </PageShell>
    </>
  );
}
