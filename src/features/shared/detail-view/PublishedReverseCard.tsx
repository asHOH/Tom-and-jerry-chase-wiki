'use client';

import { useMemo } from 'react';

import {
  unpackReferenceRow,
  type PackedGroup,
  type PackedSection,
} from '@/lib/referenceProjection';
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
import DetailRelatedCard from './DetailRelatedCard';

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

function GroupRows({ group }: { group: PackedGroup }) {
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

export default function PublishedReverseCard({ section }: { section: PackedSection }) {
  if (!section.groups.length) return null;
  const items = section.groups.map((group, index) => ({
    id: String(index),
    title: group.title + '(' + group.rows.length + ')',
    count: group.rows.length,
    children: <GroupRows group={group} />,
    activeColor: 'orange' as const,
  }));
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <DetailRelatedCard
      title={section.title + '(' + total + ')'}
      color='yellow'
      items={items}
      singleContent={null}
      lazyMountContent
    />
  );
}
