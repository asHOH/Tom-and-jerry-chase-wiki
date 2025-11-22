import { PageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return <PageLoadingState type='knowledge-cards' message='加载知识卡列表中...' />;
}
