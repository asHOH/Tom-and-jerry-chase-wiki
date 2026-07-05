'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/design';

// ---------------------------------------------------------------------------
// Hook – measures bounding rects of direct DOM children (excluding the SVG overlay)
// ---------------------------------------------------------------------------

interface TreeLineMeasurement {
  childRects: DOMRect[];
  childElements: HTMLElement[];
  containerWidth: number;
  containerHeight: number;
}

function useTreeLineMeasurement(
  containerRef: React.RefObject<HTMLDivElement | null>,
  childCount: number
): TreeLineMeasurement {
  const [result, setResult] = useState<TreeLineMeasurement>({
    childRects: [],
    childElements: [],
    containerWidth: 0,
    containerHeight: 0,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || childCount < 2) {
      setResult({ childRects: [], childElements: [], containerWidth: 0, containerHeight: 0 });
      return;
    }

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const domChildren = Array.from(container.children).filter(
        (el) => !el.hasAttribute('data-tree-overlay')
      ) as HTMLElement[];

      setResult({
        childRects: domChildren.map((child) => {
          const r = child.getBoundingClientRect();
          return new DOMRect(
            r.left - containerRect.left,
            r.top - containerRect.top,
            r.width,
            r.height
          );
        }),
        childElements: domChildren,
        containerWidth: containerRect.width,
        containerHeight: containerRect.height,
      });
    };

    measure();

    // ResizeObserver may not be available in test environments (JSDOM)
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(container);

    // Also observe each child so we catch internal size changes
    const domChildren = Array.from(container.children).filter(
      (el) => !el.hasAttribute('data-tree-overlay')
    );
    for (const child of domChildren) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, [containerRef, childCount]);

  return result;
}

// ---------------------------------------------------------------------------
// Shared SVG props
// ---------------------------------------------------------------------------

interface TreeLinesSvgProps {
  paths: string[];
  strokeColor: string;
}

const TreeLinesSvg: React.FC<TreeLinesSvgProps> = ({ paths, strokeColor }) => {
  if (paths.length === 0) return null;
  return (
    <svg
      data-tree-overlay
      className='pointer-events-none absolute inset-0 overflow-visible'
      style={{ zIndex: 10 }}
    >
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill='none'
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinecap='round'
          shapeRendering='geometricPrecision'
        />
      ))}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// AndGroupLines – horizontal connection lines between AND-group siblings
// ---------------------------------------------------------------------------

interface AndGroupLinesProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  className?: string;
}

const AndGroupLines: React.FC<AndGroupLinesProps> = ({ children, isDarkMode, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const childCount = React.Children.count(children);
  const { childRects, childElements } = useTreeLineMeasurement(containerRef, childCount);

  const paths = useMemo(() => {
    if (childRects.length < 2) return [];

    const result: string[] = [];

    for (let i = 0; i < childRects.length - 1; i++) {
      const curr = childRects[i]!;
      const next = childRects[i + 1]!;

      const x1 = curr.right;
      const y1 = curr.top + curr.height / 2;
      const x2 = next.left;
      const y2 = next.top + next.height / 2;

      // Same row detection: y-diff less than half the smaller element height
      const yDiff = Math.abs(y2 - y1);
      const threshold = Math.min(curr.height, next.height) * 0.5;

      if (yDiff < threshold) {
        // Straight horizontal connection
        const isOrGroup =
          childElements[i]?.hasAttribute('data-group-type') ||
          childElements[i + 1]?.hasAttribute('data-group-type');
        if (!isOrGroup) {
          result.push(`M ${x1} ${y1} L ${(x1 + x2) / 2} ${(y1 + y2) / 2}`);
        }
      } else {
        // Wrapped to next row – smooth S-curve
        const midY = (y1 + y2) / 2;
        const offset = 12;
        result.push(
          `M ${x1} ${y1} Q ${x1 + offset} ${y1} ${x1 + offset} ${midY} Q ${x1 + offset} ${y2} ${x2} ${y2}`
        );
      }
    }

    return result;
  }, [childRects, childElements]);

  const strokeColor = isDarkMode ? '#4a5565' : '#9ca3af';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {children}
      <TreeLinesSvg paths={paths} strokeColor={strokeColor} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// OrGroupLines – vertical stem + branch lines for OR-group children
// ---------------------------------------------------------------------------

interface OrGroupLinesProps {
  children: React.ReactNode;
  isDarkMode: boolean;
  className?: string;
}

const OrGroupLines: React.FC<OrGroupLinesProps> = ({ children, isDarkMode, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const childCount = React.Children.count(children);
  const { childRects, containerHeight } = useTreeLineMeasurement(containerRef, childCount);

  const paths = useMemo(() => {
    if (childRects.length < 2) return [];

    const result: string[] = [];
    const first = childRects[0]!;
    const last = childRects[childRects.length - 1]!;
    const stemX = -4;

    const firstCenterY = first.top + first.height / 2;
    const lastCenterY = last.top + last.height / 2;

    // Vertical stem between first and last child centers
    result.push(`M ${stemX} ${firstCenterY} L ${stemX} ${lastCenterY}`);

    // Branches from stem to each child (stem is always left of children)
    for (let i = 0; i < childRects.length; i++) {
      const rect = childRects[i]!;
      const childCenterY = rect.top + rect.height / 2;
      const childLeft = rect.left;

      // Curve the branch slightly by offsetting the control point vertically
      // based on the child's position in the stack
      const arcOffset = (i - (childRects.length - 1) / 2) * 3;
      const cpX = stemX + (childLeft - stemX) * 0.6;
      const cpY = childCenterY + arcOffset;

      result.push(`M ${stemX} ${childCenterY} Q ${cpX} ${cpY} ${childLeft} ${childCenterY}`);
    }

    // Horizontal receiving line at the container's vertical midpoint
    // so it aligns with the parent AND group's line (which arrives at container.height/2)
    const containerMidY = containerHeight / 2;
    result.push(`M ${stemX} ${containerMidY} L ${stemX * 2} ${containerMidY}`);

    return result;
  }, [childRects, containerHeight]);

  const strokeColor = isDarkMode ? '#4a5565' : '#9ca3af';

  return (
    <div ref={containerRef} className={cn('relative', className)} data-group-type='or'>
      {children}
      <TreeLinesSvg paths={paths} strokeColor={strokeColor} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { AndGroupLines, OrGroupLines };
