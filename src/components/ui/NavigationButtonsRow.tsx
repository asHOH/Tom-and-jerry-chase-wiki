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
        'border-border mx-4 flex flex-wrap items-center gap-3 border-t pt-3 pb-4 text-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
