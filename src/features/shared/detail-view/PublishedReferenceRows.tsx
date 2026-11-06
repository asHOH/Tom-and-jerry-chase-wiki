'use client';

import { useMemo } from 'react';

import { unpackReferenceRow, type PackedGroup } from '@/lib/referenceProjection';
import { useMobile } from '@/hooks/useMediaQuery';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data/static';

import {
  createReferenceHighlighter,
  ReverseReferenceResults,
  ReverseResultButton,
} from '../components/ReverseReferenceResults';

const canonical = {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
};

function PublishedRow({
  value,
  keywords,
  mobile,
  highlight,
}: {
  value: PackedGroup['rows'][number];
  keywords: PackedGroup['keywords'];
  mobile: boolean;
  highlight: ReturnType<typeof createReferenceHighlighter>;
}) {
  const row = unpackReferenceRow(canonical, value, keywords, mobile);
  return (
    <ReverseResultButton
      published
      result={row}
      highlightKeywords={highlight}
      href={row.href}
      imageUrl={row.imageUrl}
      ownerSuffix={row.ownerSuffix}
    />
  );
}

export default function PublishedReferenceRows({ group }: { group: PackedGroup }) {
  const mobile = useMobile();
  const highlight = useMemo(() => createReferenceHighlighter(group.keywords), [group.keywords]);
  return (
    <ReverseReferenceResults
      rows={group.rows}
      typeOf={(row) => ('at' in row ? row.at[0] : row.type)}
      renderRow={(value, index) => (
        <PublishedRow
          key={index}
          value={value}
          keywords={group.keywords}
          mobile={mobile}
          highlight={highlight}
        />
      )}
    />
  );
}
