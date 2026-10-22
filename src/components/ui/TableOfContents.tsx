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
  layout?: 'list' | 'inline';
};

export default function TableOfContents({
  items,
  activeId,
  ariaLabel,
  layout = 'list',
}: TableOfContentsProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ul className={layout === 'inline' ? 'flex flex-wrap gap-1' : 'space-y-1'}>
        {items.map((item) => (
          <li key={item.id} style={{ marginLeft: `${item.depth * 12}px` }}>
            <a
              href={`#${item.id}`}
              aria-current={activeId === item.id ? 'location' : undefined}
              className={cn(
                'focus-visible:ring-focus block rounded px-2 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none',
                activeId === item.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
                  : 'text-muted-foreground hover:text-blue-600 dark:hover:text-blue-300'
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
