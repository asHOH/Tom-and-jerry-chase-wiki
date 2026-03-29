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
const accordionTitleClassName = 'mb-2 gap-1 rounded-lg bg-slate-100/80 p-1 dark:bg-slate-800/70';
const accordionButtonClassName =
  'min-w-fit rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-slate-900/70 dark:hover:text-white';
const accordionActiveButtonClassName =
  'border-orange-200/80 bg-white text-orange-700 shadow-sm not-italic no-underline dark:border-orange-700/70 dark:bg-slate-900 dark:text-orange-200';
const accordionContentContainerClassName = 'mt-2';

export default function DetailRelatedCard({
  title,
  color,
  items,
  singleContent,
}: DetailRelatedCardProps) {
  const visibleItems = items.filter((item) => item.count > 0);
  const accordionItems = visibleItems.map(({ count: _count, ...item }) => item);
  const defaultOpenId = visibleItems[0]?.id;
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
      {visibleItems.length <= 1 ? (
        <div>{visibleItems[0]?.children ?? singleContent}</div>
      ) : (
        <div>
          <AccordionCard
            items={accordionItems}
            size='xs'
            useDefaultButtonColors={false}
            titleClassName={accordionTitleClassName}
            buttonClassName={accordionButtonClassName}
            activeButtonClassName={accordionActiveButtonClassName}
            contentContainerClassName={accordionContentContainerClassName}
            {...accordionProps}
          />
        </div>
      )}
    </CollapseCard>
  );
}
