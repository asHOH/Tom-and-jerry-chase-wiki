import React from 'react';
import { useState } from 'react';
import clsx from 'clsx';

type CollapseCardProps = {
  children: React.ReactNode;
  title: string;
  className?: string;
  titleClassName?: string;
  size?: 'xs' | 'md' | 'sm';
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue';
  openOnStart?: boolean;
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
  color = 'default',
  size = 'sm',
  openOnStart = false,
}: CollapseCardProps) {
  const [isExpanded, setIsExpanded] = useState(openOnStart);
  const width = { xs: '15px', md: '25px', sm: '35px' }[size];
  const text = { xs: 'sm', md: 'xl ml-1', sm: '2xl ml-2' }[size];
  const titleColor = {
    default: 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700',
    red: 'bg-red-200 dark:bg-red-900 border-2 border-red-300 dark:border-red-700',
    orange: 'bg-orange-200 dark:bg-orange-900 border-2 border-orange-300 dark:border-orange-700',
    yellow: 'bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-300 dark:border-yellow-700',
    green: 'bg-green-200 dark:bg-green-900 border-2 border-green-400 dark:border-green-700',
    blue: 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700',
    purple:
      'bg-fuchsia-200 dark:bg-fuchsia-900 border-2 border-fuchsia-300 dark:border-fuchsia-700',
  }[color];

  return (
    <div className='overflow-hidden'>
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          'flex items-center justify-between w-full font-bold px-1 py-1 focus:outline-none cursor-pointer text-black dark:text-white',
          titleColor,
          titleClassName
        )}
        aria-expanded={isExpanded}
      >
        <span className={`text-${text}`}>{title}</span>
        <svg
          className={clsx(
            'transform transition-transform duration-200 ease-in-out',
            isExpanded ? 'rotate-0' : '-rotate-90'
          )}
          width={width}
          height={width}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M19 9l-7 7-7-7'
          ></path>
        </svg>
      </button>

      {/* 动画容器 */}
      <div
        className={clsx(
          'transform transition-all duration-100 ease-in-out overflow-hidden text-black dark:text-white',
          isExpanded
            ? 'max-h-[5000px] opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 -translate-y-2'
        )}
      >
        <div
          className={clsx(
            'transform transition-all duration-100 ease-in-out',
            isExpanded ? 'translate-y-0' : '-translate-y-4'
          )}
        >
          <div className={className}>{children}</div>
        </div>
      </div>
    </div>
  );
}
