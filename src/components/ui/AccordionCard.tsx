import React from 'react';
import { useState } from 'react';
import clsx from 'clsx';

type AccordionItem = {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'purple' | 'blue';
};

type AccordionProps = {
  items: AccordionItem[];
  className?: string;
  titleClassName?: string;
  defaultOpenId?: string;
  size?: 'xs' | 'md' | 'sm';
};

/**
 * 水平滚动标签式手风琴组件
 *
 * 该组件创建一个水平排列的可折叠面板组，标题按钮在超长时可左右滑动
 * 点击任一标题会展开对应的内容面板，同时自动收起其他面板
 *
 * @param items - 手风琴项配置数组
 *   - id: 项的唯一标识
 *   - title: 标题按钮显示文本
 *   - children: 展开时显示的内容
 *   - className: 内容面板的自定义样式类
 *   - color: 标题按钮颜色主题
 *
 * @param className - 组件容器自定义样式类
 * @param titleClassName - 标题按钮容器自定义样式类
 * @param defaultOpenId - 默认展开项的id
 * @param size - 标题文本大小（xs/sm/md）
 */
export default function AccordionCard({
  items,
  className,
  titleClassName,
  defaultOpenId,
  size,
}: AccordionProps) {
  const text = { xs: 'sm', md: 'xl mx-1', sm: '2xl mx-2' }[size || 'sm'];
  const [openItems, setOpenItems] = useState<Set<string>>(
    defaultOpenId ? new Set([defaultOpenId]) : new Set()
  );

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const newOpenItems = new Set(prev);

      // 关闭其他所有项，只打开当前项
      // 如果当前项已经打开，则关闭它；否则关闭其他，打开当前
      if (newOpenItems.has(itemId)) {
        newOpenItems.clear();
      } else {
        newOpenItems.clear();
        newOpenItems.add(itemId);
      }

      return newOpenItems;
    });
  };

  return (
    <div className={className}>
      {/* 标题按钮容器 - 水平滚动布局 */}
      <div
        className={clsx(
          'flex overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
          'dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800',
          titleClassName
        )}
      >
        {items.map((item) => {
          const isExpanded = openItems.has(item.id);
          const titleColor = {
            default: 'bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700',
            red: 'bg-red-200 dark:bg-red-900 border-2 border-red-300 dark:border-red-700',
            orange:
              'bg-orange-200 dark:bg-orange-900 border-2 border-orange-300 dark:border-orange-700',
            yellow:
              'bg-yellow-200 dark:bg-yellow-900 border-2 border-yellow-300 dark:border-yellow-700',
            green: 'bg-green-200 dark:bg-green-900 border-2 border-green-400 dark:border-green-700',
            blue: 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-400 dark:border-blue-700',
            purple:
              'bg-fuchsia-200 dark:bg-fuchsia-900 border-2 border-fuchsia-300 dark:border-fuchsia-700',
          }[item.color || 'default'];

          return (
            <button
              key={item.id}
              type='button'
              onClick={() => toggleItem(item.id)}
              className={clsx(
                'flex-1 flex items-center justify-center font-bold px-1 py-1 focus:outline-none cursor-pointer text-black dark:text-white',
                'whitespace-nowrap transition-all duration-200',
                titleColor,
                isExpanded && 'italic underline'
              )}
              aria-expanded={isExpanded}
            >
              <span className={`text-${text}`}>{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* 内容面板区域 */}
      <div>
        {items.map((item) => {
          const isExpanded = openItems.has(item.id);
          return (
            isExpanded && (
              <div key={`content-${item.id}`} className={item.className}>
                {item.children}
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
