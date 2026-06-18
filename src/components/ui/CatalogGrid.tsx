'use client';

import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';

import { VirtualGrid, type VirtualGridProps } from './VirtualGrid';

export type CatalogGridProps = Omit<VirtualGridProps, 'gapPx' | 'rowClassName'> & {
  rowClassName?: string | undefined;
};

export type CatalogGridItemProps = HTMLAttributes<HTMLDivElement> & {
  clip?: boolean | undefined;
};

export function getCatalogGridRowClassName(rowClassName?: string | undefined) {
  return cn('auto-fit-grid grid-container grid', rowClassName);
}

export function getCatalogGridItemClassName({
  clip,
  className,
}: {
  clip?: boolean | undefined;
  className?: string | undefined;
} = {}) {
  return cn(
    'character-card transform transition-transform hover:-translate-y-1',
    clip && 'overflow-hidden rounded-lg',
    className
  );
}

export function CatalogGrid({ rowClassName, ...props }: CatalogGridProps) {
  const isMobile = useMobile();

  return (
    <VirtualGrid
      {...props}
      gapPx={isMobile ? 12 : 16}
      rowClassName={getCatalogGridRowClassName(rowClassName)}
    />
  );
}

export function CatalogGridItem({
  clip,
  className,
  children,
  ...props
}: CatalogGridItemProps & { children?: ReactNode }) {
  return (
    <div className={getCatalogGridItemClassName({ clip, className })} {...props}>
      {children}
    </div>
  );
}
