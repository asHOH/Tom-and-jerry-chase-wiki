import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import { ChevronDownIcon } from '@/components/icons/CommonIcons';

import {
  disclosureTitleSizeClasses,
  disclosureToneClasses,
  disclosureTriggerFocusClasses,
  type DisclosureSize,
  type DisclosureTone,
} from './disclosureStyles';

type CollapseCardProps = {
  children: React.ReactNode;
  title: string;
  className?: string;
  titleClassName?: string;
  collapsedTitleClassName?: string;
  size?: DisclosureSize;
  color?: DisclosureTone;
  openOnStart?: boolean;
  lazyMount?: boolean;
  openOnHashTargets?: string;
};

const titleSpacingClasses: Record<DisclosureSize, string> = {
  xs: '',
  sm: 'ml-1',
  md: 'ml-2',
} as const;

const chevronSizes: Record<DisclosureSize, string> = {
  xs: '15px',
  sm: '25px',
  md: '35px',
};

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
  const titleClassNames = cn(disclosureTitleSizeClasses[size], titleSpacingClasses[size]);
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
          'flex w-full cursor-pointer items-center justify-between px-1 py-1 font-bold text-black dark:text-white',
          disclosureTriggerFocusClasses,
          color === 'default' ? 'border-b' : 'border-2',
          disclosureToneClasses[color],
          titleClassName,
          !isExpanded && collapsedTitleClassName
        )}
        aria-expanded={isExpanded}
      >
        <span className={titleClassNames}>{title}</span>
        <ChevronDownIcon
          className={cn(
            'transform transition-transform duration-200 ease-in-out motion-reduce:transition-none',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
          size={chevronSizes[size]}
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
