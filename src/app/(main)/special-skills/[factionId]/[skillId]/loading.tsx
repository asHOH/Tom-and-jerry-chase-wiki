'use client';

import LoadingState from '@/components/ui/LoadingState';

export default function Loading() {
  return (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <LoadingState type='detail' message='加载特技详情中...' />
    </div>
  );
}
