import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';

type CollapseCardProps = {
  children: React.ReactNode;
  title: string;
  className?: string;
  titleClassName?: string;
  collapsedTitleClassName?: string;
  size?: 'xs' | 'sm' | 'md';
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue' | 'lime';
  openOnStart?: boolean;
  lazyMount?: boolean;
  openOnHashTargets?: string;
};

const titleSizeClasses = {
  xs: 'text-sm',
  sm: 'ml-1 text-xl',
  md: 'ml-2 text-2xl',
} as const;

/**
 * 可折叠卡片组件
 * @param children - 卡片内容
 * @param title - 标题文本
 * @param className - 内容容器样式
 * @param titleClassName - 标题栏样式
 * @param size - 尺寸: xs/sm/md
 * @param color - 颜色主题
 * @param openOnStart - 初始是否展开
 */
export default function CollapseCard({
  children,
  title,
  className,
  titleClassName,
  collapsedTitleClassName,
  color = 'default',
  size = 'md',
  openOnStart = false,
  lazyMount = false,
  openOnHashTargets,
}: CollapseCardProps) {
  const [isExpanded, setIsExpanded] = useState(openOnStart);
  const [hasMountedChildren, setHasMountedChildren] = useState(openOnStart);
  const width = { xs: '15px', sm: '25px', md: '35px' }[size];
  const titleSizeClassName = titleSizeClasses[size];
  const titleColor = {
    default: 'border-b border-gray-100 dark:border-gray-800',
    red: 'bg-red-200 dark:bg-red-900 border-2 border-red-300 dark:border-red-700',
    orange: 'bg-orange-200 dark:bg-orange-900 border-2 border-orange-300 dark:border-orange-700',
    yellow: 'bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-300 dark:border-yellow-700',
    green: 'bg-green-200 dark:bg-green-900 border-2 border-green-400 dark:border-green-700',
    blue: 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700',
    purple:
      'bg-fuchsia-200 dark:bg-fuchsia-900 border-2 border-fuchsia-300 dark:border-fuchsia-700',
    lime: 'bg-lime-100 dark:bg-lime-900 border-2 border-lime-200 dark:border-lime-700',
  }[color];
  const shouldRenderChildren = !lazyMount || isExpanded || hasMountedChildren;

  useEffect(() => {
    if (!openOnHashTargets) return;

    const hashTargets = new Set(openOnHashTargets.split(' '));

    const revealHashTarget = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hashTargets.has(hash)) return;

      setHasMountedChildren(true);
      setIsExpanded(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ block: 'center' });
        });
      });
    };

    revealHashTarget();
    window.addEventListener('hashchange', revealHashTarget);
    return () => window.removeEventListener('hashchange', revealHashTarget);
  }, [openOnHashTargets]);

  const handleToggle = () => {
    const nextIsExpanded = !isExpanded;
    if (nextIsExpanded) {
      setHasMountedChildren(true);
    }
    setIsExpanded(nextIsExpanded);
  };

  return (
    <div className='overflow-hidden'>
      <Button
        variant='unstyled'
        type='button'
        onClick={handleToggle}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between px-1 py-1 font-bold text-black focus:outline-none dark:text-white',
          titleColor,
          titleClassName,
          !isExpanded && collapsedTitleClassName
        )}
        aria-expanded={isExpanded}
      >
        <span className={titleSizeClassName}>{title}</span>
        <ChevronDownIcon
          className={cn(
            'transform transition-transform duration-200 ease-in-out motion-reduce:transition-none',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
          size={width}
        />
      </Button>

      {/* 动画容器 */}
      <div
        className={cn(
          'transform overflow-hidden text-gray-700 transition-all duration-100 ease-in-out dark:text-gray-300',
          isExpanded ? 'max-h-9999 translate-y-0 opacity-100' : 'max-h-0 -translate-y-2 opacity-0'
        )}
      >
        {shouldRenderChildren ? (
          <div
            className={cn(
              'transform transition-all duration-100 ease-in-out',
              isExpanded ? 'translate-y-0' : '-translate-y-4'
            )}
          >
            <div className={className}>{children}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
