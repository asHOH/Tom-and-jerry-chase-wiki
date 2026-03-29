import type { ReactNode } from 'react';

import AccordionCard from '@/components/ui/AccordionCard';
import CollapseCard from '@/components/ui/CollapseCard';

type DetailRelatedCardItem = {
  id: string;
  title: string;
  children: ReactNode;
  count: number;
  activeColor?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue';
};

type DetailRelatedCardProps = {
  title: string;
  color: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue' | 'lime';
  items: DetailRelatedCardItem[];
  singleContent: ReactNode;
};

const contentClassName =
  'rounded-b-md border border-t-0 border-slate-200/80 bg-white/80 px-3 pb-3 pt-2 whitespace-pre-wrap shadow-sm dark:border-slate-700 dark:bg-slate-900/40';

const titleClassName = 'rounded-t-md border px-3 pt-1.5 pb-1';
const collapsedTitleClassName = 'rounded-md';

export default function DetailRelatedCard({
  title,
  color,
  items,
  singleContent,
}: DetailRelatedCardProps) {
  const accordionItems = items.map(({ count: _count, ...item }) => item);
  const defaultOpenId = items.find((item) => item.count > 0)?.id ?? items[0]?.id;
  const accordionProps = defaultOpenId ? { defaultOpenId } : {};

  return (
    <CollapseCard
      title={title}
      size='xs'
      className={contentClassName}
      titleClassName={titleClassName}
      collapsedTitleClassName={collapsedTitleClassName}
      color={color}
    >
      {items.length <= 1 ? (
        <div>{singleContent}</div>
      ) : (
        <div>
          <AccordionCard items={accordionItems} size='xs' {...accordionProps} />
        </div>
      )}
    </CollapseCard>
  );
}
