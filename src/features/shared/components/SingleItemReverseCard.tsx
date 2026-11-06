import { useMemo } from 'react';

import singleItemReverse, { getCategorizedKeywords } from '@/lib/singleItemReverse';
import {
  getSingleItemHref,
  getSingleItemImageUrl,
  getSingleItemOwnerSuffix,
} from '@/lib/singleItemTools';
import { useMobile } from '@/hooks/useMediaQuery';
import type { SingleItem } from '@/data/types';

import {
  createReferenceHighlighter,
  ReverseReferenceResults,
  ReverseResultButton,
} from './ReverseReferenceResults';

function LegacyResult({
  row,
  highlight,
}: {
  row: ReturnType<typeof singleItemReverse>[number];
  highlight: ReturnType<typeof createReferenceHighlighter>;
}) {
  return (
    <ReverseResultButton
      result={row}
      highlightKeywords={highlight}
      href={getSingleItemHref(row)}
      imageUrl={getSingleItemImageUrl(row)}
      ownerSuffix={getSingleItemOwnerSuffix(row)}
    />
  );
}

export default function SingleItemReverseCard({ singleItem }: { singleItem: SingleItem }) {
  const isMobile = useMobile();
  const rows = singleItemReverse(singleItem, isMobile);
  const highlight = useMemo(
    () => createReferenceHighlighter(getCategorizedKeywords(singleItem)),
    [singleItem]
  );
  return (
    <ReverseReferenceResults
      rows={rows}
      typeOf={(row) => row.type}
      renderRow={(row, key) => <LegacyResult key={key} row={row} highlight={highlight} />}
    />
  );
}
