// @/components/ui/CollapsibleItems.tsx
'use client';

import { useState } from 'react';

import { SingleItem } from '@/data/types';
import SingleItemButton from '@/components/ui/SingleItemButton';

// 箭头SVG组件 - 与原文件保持一致
const ArrowIcon = ({ expanded }: { expanded: boolean }) => (
  <div className={`transition-transform duration-300 ${expanded ? 'rotate-90' : 'rotate-0'}`}>
    <svg
      className='h-5 w-5'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
    </svg>
  </div>
);

interface CollapsibleItemsProps {
  /** 要显示的数据项，可以是单个或多个 */
  items: SingleItem | SingleItem[];
  /** 显示的标题，例如"归属者：" */
  title?: string;
  /** 组件标签，用于aria-label */
  label?: string;
  /** 是否默认展开 */
  defaultExpanded?: boolean;
  /** 展开时动画的最大高度 */
  maxExpandHeight?: string;
}

/**
 * 可折叠的项目列表组件
 *
 * 特性：
 * 1. 传入单个项目时，直接显示该项目
 * 2. 传入多个项目时，默认显示第一个项目，点击箭头展开/折叠显示所有项目
 * 3. 传入空数组时，不显示任何内容
 */
export default function CollapsibleItems({
  items,
  title,
  label = '项目',
  defaultExpanded = false,
  maxExpandHeight = '500px',
}: CollapsibleItemsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 处理空值情况
  if (!items) return null;

  // 如果是数组
  if (Array.isArray(items)) {
    const itemsArray = items;

    // 空数组不显示
    if (itemsArray.length === 0) {
      return null;
    }

    // 只有一个元素时按原方式显示
    if (itemsArray.length === 1) {
      return (
        <span className='flex items-center text-sm'>
          {title}
          {itemsArray[0] !== undefined ? <SingleItemButton singleItem={itemsArray[0]} /> : null}
        </span>
      );
    }

    // 多个元素时
    const firstItem = itemsArray[0];

    return (
      <div className='flex flex-col gap-2 text-sm'>
        <div className='flex items-center'>
          {title && <span className='mr-2 whitespace-nowrap'>{title}</span>}
          <div className='flex flex-wrap items-center gap-1'>
            {firstItem !== undefined ? <SingleItemButton singleItem={firstItem} /> : null}
            {'等…'}
            <button
              onClick={() => setExpanded(!expanded)}
              className='ml-1 flex items-center justify-center rounded-full p-1.5 transition-all duration-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:outline-none dark:hover:bg-gray-800 dark:focus:ring-gray-600'
              aria-label={expanded ? `折叠${label}列表` : `展开${label}列表`}
              type='button'
            >
              <ArrowIcon expanded={expanded} />
            </button>
          </div>
        </div>

        {/* 展开的剩余项目列表 - 使用纯CSS动画 */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? `max-h-[${maxExpandHeight}] opacity-100` : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className={`flex flex-wrap gap-2 pt-1 transition-opacity duration-300 ${
              expanded ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {itemsArray.map((item, index) => (
              <SingleItemButton key={index} singleItem={item} size='small' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 如果是单个元素（原逻辑）
  return (
    <span className='flex items-center text-sm'>
      {title}
      <SingleItemButton singleItem={items} />
    </span>
  );
}
