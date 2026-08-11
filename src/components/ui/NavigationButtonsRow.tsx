import { ReactNode } from 'react';

import { cn } from '@/lib/design';

type NavigationButtonsRowProps = {
  children: ReactNode;
  className?: string;
};

export default function NavigationButtonsRow({ children, className }: NavigationButtonsRowProps) {
  return (
    <div
      className={cn(
        'mx-4 flex flex-wrap items-center gap-3 border-t border-gray-300 pt-2 pb-4 text-sm dark:border-gray-600',
        className
      )}
    >
      {children}
    </div>
  );
}
