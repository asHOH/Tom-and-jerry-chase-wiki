'use client';

import Button from '@/components/ui/Button';

export default function OfflinePage() {
  return (
    <div className='bg-background text-foreground flex min-h-screen items-center justify-center'>
      <div className='mx-auto max-w-md p-6 text-center'>
        <h1 className='mb-4 text-2xl font-bold'>离线状态</h1>
        <p className='text-muted-foreground mb-6'>您当前处于离线状态，部分功能可能不可用。</p>
        <div className='space-y-4'>
          <Button onClick={() => window.location.reload()} fullWidth>
            重新加载
          </Button>
          <Button onClick={() => window.history.back()} variant='secondary' fullWidth>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  );
}
