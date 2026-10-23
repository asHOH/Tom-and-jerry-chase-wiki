import type { ReactNode } from 'react';

import { cn } from '@/lib/design';

export type TableOfContentsItem = {
  id: string;
  label: ReactNode;
  depth: number;
};

type TableOfContentsProps = {
  items: readonly TableOfContentsItem[];
  activeId: string;
  ariaLabel: string;
  layout?: 'list' | 'inline' | 'wrap';
  appearance?: 'default' | 'plain';
};

export default function TableOfContents({
  items,
  activeId,
  ariaLabel,
  layout = 'list',
  appearance = 'default',
}: TableOfContentsProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul
        className={
          layout === 'inline'
            ? 'flex [scrollbar-width:none] gap-1 overflow-x-auto whitespace-nowrap'
            : layout === 'wrap'
              ? 'flex flex-wrap gap-x-2'
              : 'space-y-1'
        }
      >
        {items.map((item) => (
          <li
            key={item.id}
            className={layout === 'wrap' ? 'max-w-full min-w-0' : 'shrink-0'}
            style={{ marginLeft: `${item.depth * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'location' : undefined}
              onFocus={
                layout === 'inline'
                  ? (event) =>
                      event.currentTarget.scrollIntoView({
                        block: 'nearest',
                        inline: 'nearest',
                        behavior: 'instant',
                      })
                  : undefined
              }
              className={cn(
                'focus-visible:ring-focus block rounded px-2 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none',
                layout === 'inline' && 'flex min-h-10 items-center focus-visible:ring-inset',
                appearance === 'plain' &&
                  'flex min-h-11 items-center rounded-none px-3 font-medium focus-visible:ring-inset',
                appearance === 'plain' &&
                  layout === 'inline' &&
                  'min-h-12 border-b-2 border-transparent',
                layout === 'wrap' && 'wrap-anywhere',
                appearance === 'plain'
                  ? activeId === item.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-muted-foreground hover:text-foreground'
                  : activeId === item.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                    : 'text-muted-foreground hover:text-blue-600 dark:hover:text-blue-300',
                appearance === 'plain' &&
                  activeId === item.id &&
                  (layout === 'inline'
                    ? 'border-blue-600 dark:border-blue-400'
                    : 'underline underline-offset-4')
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
