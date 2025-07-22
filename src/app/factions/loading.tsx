import { PageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return <PageLoadingState type='character-grid' message='加载角色列表中...' />;
}
