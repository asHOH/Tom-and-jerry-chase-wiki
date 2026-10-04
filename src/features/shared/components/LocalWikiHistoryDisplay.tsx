import { useWikiHistory } from '@/hooks/useWikiHistory';
import type { SingleItem } from '@/data/types';

import { WikiHistoryDisplay } from './SingleItemWikiHistoryDisplay';

export default function LocalWikiHistoryDisplay({ singleItem }: { singleItem: SingleItem }) {
  const history = useWikiHistory([singleItem]);
  return <WikiHistoryDisplay entries={history} unavailable={false} />;
}
