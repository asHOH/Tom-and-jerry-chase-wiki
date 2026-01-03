'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

export type VirtualGridProps = {
  items: React.ReactNode[];
  minItemWidth: number;
  estimatedRowHeight: number;
  gapPx?: number;
  overscan?: number;
  fixedColumns?: number;
  className?: string;
  rowClassName?: string;
};

function clampColumns(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.max(1, Math.floor(value));
}

export function VirtualGrid({
  items,
  minItemWidth,
  estimatedRowHeight,
  gapPx = 0,
  overscan = 8,
  fixedColumns,
  className,
  rowClassName,
}: VirtualGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setContainerWidth(el.clientWidth);
    });

    ro.observe(el);
    setContainerWidth(el.clientWidth);

    return () => {
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScrollMargin = () => {
      const rect = el.getBoundingClientRect();
      setScrollMargin(rect.top + window.scrollY);
    };

    updateScrollMargin();
    window.addEventListener('resize', updateScrollMargin, { passive: true });

    return () => {
      window.removeEventListener('resize', updateScrollMargin);
    };
  }, [containerWidth]);

  const columns = useMemo(() => {
    if (fixedColumns && fixedColumns > 0) return fixedColumns;
    if (containerWidth <= 0) return 1;

    // Account for gaps when estimating how many columns fit.
    const effective = (containerWidth + gapPx) / (minItemWidth + gapPx);
    return clampColumns(effective);
  }, [containerWidth, fixedColumns, gapPx, minItemWidth]);

  const rowCount = useMemo(() => {
    return Math.ceil(items.length / columns);
  }, [columns, items.length]);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimatedRowHeight,
    overscan,
    scrollMargin,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div ref={containerRef} className={className}>
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className={rowClassName}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(${minItemWidth}px, 1fr))`,
                gap: gapPx,
                boxSizing: 'border-box',
                paddingBottom: gapPx,
              }}
            >
              {rowItems}
            </div>
          );
        })}
      </div>
    </div>
  );
}
