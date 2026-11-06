'use client';

import { useEffect } from 'react';

import { preparedModule } from '@/lib/preparedModule';
import type { PackedGroup, PackedSection } from '@/lib/referenceProjection';
import { usePreparedComponent } from '@/hooks/usePreparedComponent';
import Button from '@/components/ui/Button';

import DetailRelatedCard from './DetailRelatedCard';

const referenceRows = preparedModule(() => import('./PublishedReferenceRows'));

function PreparedRows({ group }: { group: PackedGroup }) {
  const { Component: Rows, error, retry } = usePreparedComponent(referenceRows, true);
  if (Rows) return <Rows group={group} />;
  return (
    <div role='status'>
      {error ? (
        <>
          引用项加载失败 <Button onClick={retry}>重试</Button>
        </>
      ) : (
        '正在加载引用项…'
      )}
    </div>
  );
}

export default function PublishedReverseCard({ section }: { section: PackedSection }) {
  const hasRows = section.groups.length > 0;
  useEffect(() => {
    // Warm the code after render for offline visits. Opening the card retries a failed warmup.
    if (hasRows) void referenceRows.load().catch(() => {});
  }, [hasRows]);
  if (!hasRows) return null;
  const items = section.groups.map((group, index) => ({
    id: String(index),
    title: group.title + '(' + group.rows.length + ')',
    count: group.rows.length,
    children: <PreparedRows group={group} />,
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
