import ButtonLink from '@/components/ui/ButtonLink';

export default function NotFound() {
  return (
    <div className='bg-background text-foreground flex min-h-screen items-center justify-center'>
      <div className='bg-surface mx-auto max-w-md rounded-lg p-6 text-center shadow-lg'>
        <h1 className='mb-4 text-4xl font-bold'>404</h1>
        <h2 className='text-muted-foreground mb-4 text-xl font-semibold'>页面未找到</h2>
        <p className='text-muted-foreground mb-6'>抱歉，您访问的页面不存在。</p>
        <ButtonLink href='/'>返回首页</ButtonLink>
      </div>
    </div>
  );
}
