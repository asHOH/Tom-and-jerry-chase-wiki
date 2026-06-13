'use client';

import dynamic from 'next/dynamic';

import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { PageLoadingState } from '@/components/ui/LoadingState';

type Props = { description?: string };

const ToolGridClient = dynamic<Props>(() => import('@/features/tools/ToolGrid'), {
  loading: () => (
    <PageLoadingState
      layout='catalog'
      type='item-grid'
      message='加载工具列表中...'
      count={LOADING_COUNTS.tools}
    />
  ),
});

export default ToolGridClient;
