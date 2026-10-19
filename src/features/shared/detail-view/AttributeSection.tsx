import type { ReactNode } from 'react';

import { cn } from '@/lib/design';

type AttributeSectionProps = {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
};

export default function AttributeSection({
  title,
  children,
  className,
  titleClassName,
}: AttributeSectionProps) {
  return (
    <div className={cn('border-border border-t pt-1', className)}>
      {title ? (
        <span className={cn('text-lg font-bold whitespace-pre', titleClassName)}>{title}</span>
      ) : null}
      {children}
    </div>
  );
}
