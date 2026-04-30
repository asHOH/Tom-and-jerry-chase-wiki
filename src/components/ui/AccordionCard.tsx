import React, { startTransition, useState } from 'react';

import { cn } from '@/lib/design';

type AccordionItem = {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue';
  activeColor?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue';
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
  titleClassName?: string;
  defaultOpenId?: string;
  size?: 'xs' | 'sm' | 'md';
  useDefaultButtonColors?: boolean;
  buttonClassName?: string;
  activeButtonClassName?: string;
  contentContainerClassName?: string;
  contentPanelClassName?: string;
};

const colorMap = {
  default: 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700',
  red: 'bg-red-200 dark:bg-red-900 border-2 border-red-300 dark:border-red-700',
  orange: 'bg-orange-200 dark:bg-orange-900 border-2 border-orange-300 dark:border-orange-700',
  yellow: 'bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-300 dark:border-yellow-700',
  green: 'bg-green-200 dark:bg-green-900 border-2 border-green-400 dark:border-green-700',
  blue: 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700',
  purple: 'bg-fuchsia-200 dark:bg-fuchsia-900 border-2 border-fuchsia-300 dark:border-fuchsia-700',
} as const;

const titleSizeClasses = {
  xs: 'text-sm',
  sm: 'mx-1 text-xl',
  md: 'mx-2 text-2xl',
} as const;

export default function AccordionCard({
  items,
  className,
  titleClassName,
  defaultOpenId,
  size,
  useDefaultButtonColors = true,
  buttonClassName,
  activeButtonClassName,
  contentContainerClassName,
  contentPanelClassName,
}: AccordionProps) {
  const titleSizeClassName = titleSizeClasses[size || 'md'];
  const [activeItemId, setActiveItemId] = useState<string | null>(defaultOpenId ?? null);
  const [renderedItemId, setRenderedItemId] = useState<string | null>(defaultOpenId ?? null);

  const toggleItem = (itemId: string) => {
    const nextItemId = activeItemId === itemId ? null : itemId;

    setActiveItemId(nextItemId);
    startTransition(() => {
      setRenderedItemId(nextItemId);
    });
  };

  return (
    <div className={className}>
      <div
        className={cn(
          'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex overflow-x-auto',
          'dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800',
          titleClassName
        )}
      >
        {items.map((item) => {
          const isExpanded = activeItemId === item.id;
          const colorToUse =
            isExpanded && item.activeColor ? item.activeColor : item.color || 'default';
          const titleColor = colorMap[colorToUse];

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => toggleItem(item.id)}
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center px-1 py-1 font-bold text-black focus:outline-none dark:text-white',
                'whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-200',
                useDefaultButtonColors && titleColor,
                useDefaultButtonColors && isExpanded && 'italic underline',
                buttonClassName,
                isExpanded && activeButtonClassName
              )}
              aria-expanded={isExpanded}
            >
              <span className={titleSizeClassName}>{item.title}</span>
            </button>
          );
        })}
      </div>

      <div className={contentContainerClassName}>
        {items.map((item) => {
          const isExpanded = renderedItemId === item.id;

          return (
            isExpanded && (
              <div key={`content-${item.id}`} className={cn(contentPanelClassName, item.className)}>
                {item.children}
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
