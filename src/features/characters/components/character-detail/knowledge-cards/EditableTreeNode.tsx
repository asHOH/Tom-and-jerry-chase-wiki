'use client';

import { memo, useState } from 'react';

import { cn } from '@/lib/design';
import type { CardGroup, CardGroupType } from '@/data/types';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { CloseIcon, PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

export interface EditableTreeNodeProps {
  cards: readonly CardGroup[];
  parentPath: readonly number[];
  depth: number;
  imageBasePath: string;
  onDeleteNode: (path: number[]) => void;
  onRequestAddCard: (parentPath: number[]) => void;
  onAddGroup: (parentPath: number[], groupType: CardGroupType) => void;
  onToggleGroupType: (path: number[], newType: CardGroupType) => void;
  onUnwrapGroup: (path: number[]) => void;
}

const andBadgeClass =
  'text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
const orBadgeClass =
  'text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';

const smallButtonClass =
  'hover:bg-control-hover rounded px-1.5 py-0.5 text-xs text-gray-600 transition-colors dark:text-gray-400';

/** Renders a single group-tuple header with edit controls. */
const GroupHeader = memo(
  ({
    isOr,
    path,
    onToggleGroupType,
    onRequestAddCard,
    onAddGroup,
    onUnwrapGroup,
    onDeleteNode,
  }: {
    isOr: boolean;
    path: number[];
    onToggleGroupType: (path: number[], newType: CardGroupType) => void;
    onRequestAddCard: (parentPath: number[]) => void;
    onAddGroup: (parentPath: number[], groupType: CardGroupType) => void;
    onUnwrapGroup: (path: number[]) => void;
    onDeleteNode: (path: number[]) => void;
  }) => {
    const [showAddGroupPopover, setShowAddGroupPopover] = useState(false);

    return (
      <div className='mb-1 flex flex-wrap items-center gap-1'>
        <span className={isOr ? orBadgeClass : andBadgeClass}>{isOr ? 'OR' : 'AND'}</span>
        <Button
          variant='unstyled'
          type='button'
          className={smallButtonClass}
          onClick={() => onToggleGroupType(path, isOr ? 0 : 1)}
          title={isOr ? '切换为 AND' : '切换为 OR'}
        >
          切换
        </Button>
        <Button
          variant='unstyled'
          type='button'
          className={smallButtonClass}
          onClick={() => onRequestAddCard(path)}
        >
          +卡
        </Button>
        <span className='relative'>
          <Button
            variant='unstyled'
            type='button'
            className={smallButtonClass}
            onClick={() => setShowAddGroupPopover((prev) => !prev)}
          >
            +子组
          </Button>
          {showAddGroupPopover && (
            <span className='border-border bg-surface-raised text-foreground absolute top-full left-0 z-30 mt-1 flex gap-1 rounded border p-1 shadow-sm'>
              <Button
                variant='unstyled'
                type='button'
                className={cn(smallButtonClass, 'text-blue-600 dark:text-blue-400')}
                onClick={() => {
                  onAddGroup(path, 0);
                  setShowAddGroupPopover(false);
                }}
              >
                AND
              </Button>
              <Button
                variant='unstyled'
                type='button'
                className={cn(smallButtonClass, 'text-amber-600 dark:text-amber-400')}
                onClick={() => {
                  onAddGroup(path, 1);
                  setShowAddGroupPopover(false);
                }}
              >
                OR
              </Button>
            </span>
          )}
        </span>
        <Button
          variant='unstyled'
          type='button'
          className={smallButtonClass}
          onClick={() => onUnwrapGroup(path)}
          title='拆分分组'
        >
          拆
        </Button>
        <IconButton
          type='button'
          aria-label='删除分组'
          onClick={() => onDeleteNode(path)}
          variant='delete'
          size='xs'
        >
          <CloseIcon className='h-3 w-3' aria-hidden='true' />
        </IconButton>
      </div>
    );
  }
);

GroupHeader.displayName = 'GroupHeader';

/** Recursive tree editor for CardGroup[] at a single level. */
function EditableTreeNode({
  cards,
  parentPath,
  depth,
  imageBasePath,
  onDeleteNode,
  onRequestAddCard,
  onAddGroup,
  onToggleGroupType,
  onUnwrapGroup,
}: EditableTreeNodeProps) {
  const isRoot = depth === 0;
  const indentStyle = depth > 0 ? { marginLeft: `${Math.min(depth * 12, 48)}px` } : undefined;

  return (
    <div className='space-y-1.5'>
      {isRoot && (
        <div className='mb-2 flex items-center gap-2'>
          <span className='bg-surface-muted rounded px-2 py-1 text-xs font-bold text-gray-500 dark:text-gray-400'>
            隐式 AND (根层级)
          </span>
        </div>
      )}

      {cards.map((item, index) => {
        const itemPath = [...parentPath, index];

        if (typeof item === 'string') {
          return (
            <div key={index} className='flex items-center gap-1' style={indentStyle}>
              <Image
                src={`${imageBasePath}${item}.png`}
                alt={item}
                width={64}
                height={64}
                className='h-16 w-16 object-contain'
              />
              <IconButton
                type='button'
                aria-label='移除此知识卡'
                onClick={() => onDeleteNode(itemPath)}
                variant='delete'
                size='xs'
              >
                <CloseIcon className='h-3 w-3' aria-hidden='true' />
              </IconButton>
            </div>
          );
        }

        // Group tuple: [type, ...children]
        const [groupType, ...children] = item;
        const isOr = groupType === 1;

        return (
          <div
            key={index}
            className={cn(
              'rounded border-l-2 pl-3',
              isOr
                ? 'border-amber-400 bg-amber-50/30 dark:border-amber-500/50 dark:bg-amber-900/10'
                : 'border-blue-400 bg-blue-50/30 dark:border-blue-500/50 dark:bg-blue-900/10'
            )}
            style={indentStyle}
          >
            <GroupHeader
              isOr={isOr}
              path={itemPath}
              onToggleGroupType={onToggleGroupType}
              onRequestAddCard={onRequestAddCard}
              onAddGroup={onAddGroup}
              onUnwrapGroup={onUnwrapGroup}
              onDeleteNode={onDeleteNode}
            />
            {children.length > 0 ? (
              <EditableTreeNode
                cards={children}
                parentPath={itemPath}
                depth={depth + 1}
                imageBasePath={imageBasePath}
                onDeleteNode={onDeleteNode}
                onRequestAddCard={onRequestAddCard}
                onAddGroup={onAddGroup}
                onToggleGroupType={onToggleGroupType}
                onUnwrapGroup={onUnwrapGroup}
              />
            ) : (
              <p className='py-1 text-xs text-gray-400 italic dark:text-gray-500'>
                空分组 — 添加知识卡或子组
              </p>
            )}
          </div>
        );
      })}

      {/* Root-level action bar */}
      {isRoot && (
        <div className='mt-3 flex flex-wrap gap-1.5'>
          <Button
            variant='unstyled'
            type='button'
            className={cn(smallButtonClass, 'flex items-center gap-1')}
            onClick={() => onRequestAddCard([])}
          >
            <PlusIcon className='h-3 w-3' aria-hidden='true' /> 添加知识卡
          </Button>
          <Button
            variant='unstyled'
            type='button'
            className={cn(smallButtonClass, 'text-blue-600 dark:text-blue-400')}
            onClick={() => onAddGroup([], 0)}
          >
            + AND组
          </Button>
          <Button
            variant='unstyled'
            type='button'
            className={cn(smallButtonClass, 'text-amber-600 dark:text-amber-400')}
            onClick={() => onAddGroup([], 1)}
          >
            + OR组
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(EditableTreeNode);
