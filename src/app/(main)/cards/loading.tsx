import { LOADING_COUNTS } from '@/constants/loadingCounts';
import { CatalogPageLoadingState } from '@/components/ui/LoadingState';

export default function Loading() {
  return (
    <CatalogPageLoadingState
      type='knowledge-cards'
      message='加载知识卡列表中...'
      count={LOADING_COUNTS.knowledgeCards}
    />
  );
}
