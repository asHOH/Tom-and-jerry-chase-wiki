'use client';

import { PageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return <PageLoadingState type='detail' message='加载特技详情中...' />;
}
