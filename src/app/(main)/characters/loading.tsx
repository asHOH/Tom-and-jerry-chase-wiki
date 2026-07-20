import { PageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return <PageLoadingState type='character-detail' message='加载角色详情中...' />;
}
