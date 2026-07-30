import React from 'react';

import { getSingleItemOwnedBuffs } from '@/lib/singleItemOwnbuffs';
import { SingleItem } from '@/data/types';

import { compareBuffDescriptions } from './compareBuff';
import TextWithHoverTooltips from './TextWithHoverTooltips';

interface SingleItemOwnbuffsTextProps {
  singleItem: SingleItem;
}

interface State {
  sortMode: 'default' | 'name';
  compareMode: boolean;
}

function extractFullName(description: string): string {
  const match = description.match(/^“([^”]+)”/);
  return match ? match[1] || '' : '';
}

function getBaseName(fullName: string): string {
  const lastDash = fullName.lastIndexOf('-');
  if (lastDash === -1) return fullName;
  return fullName.substring(0, lastDash);
}

export default class SingleItemOwnbuffsCard extends React.Component<
  SingleItemOwnbuffsTextProps,
  State
> {
  constructor(props: SingleItemOwnbuffsTextProps) {
    super(props);
    this.state = {
      sortMode: 'default',
      compareMode: false,
    };
    this.toggleSort = this.toggleSort.bind(this);
    this.toggleCompare = this.toggleCompare.bind(this);
  }

  toggleSort() {
    this.setState((prev) => ({
      sortMode: prev.sortMode === 'default' ? 'name' : 'default',
    }));
  }

  toggleCompare() {
    this.setState((prev) => ({
      compareMode: !prev.compareMode,
    }));
  }

  render() {
    const { singleItem } = this.props;
    const { sortMode, compareMode } = this.state;
    const ownedBuffs = getSingleItemOwnedBuffs(singleItem);

    if (ownedBuffs.length === 0) {
      return (
        <TextWithHoverTooltips text='    $暂未收录相关状态$italic text-gray-500 dark:text-gray-400 text-sm#' />
      );
    }

    const sortedBuffs = [...ownedBuffs];
    if (sortMode === 'name') {
      sortedBuffs.sort((a, b) => {
        const nameA = extractFullName(a.description);
        const nameB = extractFullName(b.description);
        return nameA.localeCompare(nameB, 'zh-Hans-CN');
      });
    }

    let displayBuffs: { id: string; description: string }[] = [];
    if (compareMode) {
      const groups = new Map<string, typeof sortedBuffs>();
      for (const buff of sortedBuffs) {
        const fullName = extractFullName(buff.description);
        const base = getBaseName(fullName);
        if (!groups.has(base)) {
          groups.set(base, []);
        }
        // 使用非空断言，因为上面已经确保键存在
        groups.get(base)!.push(buff);
      }

      for (const [_base, group] of groups) {
        if (group.length === 0) continue;
        // 第一个条目显示原始描述
        displayBuffs.push({
          id: (group[0] || { id: '' }).id,
          description: (group[0] || { description: '' }).description,
        });
        // 后续条目显示与前一个的差异
        for (let i = 1; i < group.length; i++) {
          const prev = group[i - 1]!;
          const curr = group[i]!;
          const diff = compareBuffDescriptions(
            curr.description,
            prev.description,
            extractFullName(prev.description)
          );
          if (diff) {
            displayBuffs.push({ id: curr.id, description: diff });
          } else {
            displayBuffs.push({
              id: curr.id,
              description: `“${extractFullName(curr.description)}”：与“${extractFullName(prev.description)}”效果相同。`,
            });
          }
        }
      }
    } else {
      displayBuffs = sortedBuffs.map((b) => ({ id: b.id, description: b.description }));
    }

    return (
      <>
        <div className='mb-1 flex flex-wrap items-center gap-3'>
          {/* 排序开关 */}
          <div
            className='relative inline-flex h-6 min-w-[120px] cursor-pointer overflow-hidden rounded-full border border-gray-300 select-none dark:border-gray-600'
            onClick={this.toggleSort}
          >
            <div
              className={`absolute top-0 h-full w-1/2 transition-all duration-300 ease-in-out ${
                sortMode === 'default' ? 'left-0' : 'left-1/2'
              } rounded-full bg-blue-500 dark:bg-blue-400`}
            />
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                sortMode === 'default' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              默认排列
            </div>
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                sortMode === 'name' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              名称排列
            </div>
          </div>

          {/* 比对模式开关 */}
          <div
            className='relative inline-flex h-6 min-w-[120px] cursor-pointer overflow-hidden rounded-full border border-gray-300 select-none dark:border-gray-600'
            onClick={this.toggleCompare}
          >
            <div
              className={`absolute top-0 h-full w-1/2 transition-all duration-300 ease-in-out ${
                compareMode === false ? 'left-0' : 'left-1/2'
              } rounded-full bg-purple-500 dark:bg-purple-400`}
            />
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                compareMode === false ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              默认模式
            </div>
            <div
              className={`relative z-10 flex flex-1 items-center justify-center text-xs ${
                compareMode === true ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              比对模式
            </div>
          </div>

          <span className='text-xs text-gray-500 dark:text-gray-400'>
            （部分相关信息可查阅 状态效果 或 机制-状态 页面）
          </span>
        </div>

        {displayBuffs.map(({ id, description }) => (
          <div key={id} id={`buff-${id}`} className='scroll-mt-24'>
            <TextWithHoverTooltips text={description} />
          </div>
        ))}
      </>
    );
  }
}
