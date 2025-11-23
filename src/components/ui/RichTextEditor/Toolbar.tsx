import React, { useState } from 'react';
import clsx from 'clsx';

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BlockquoteIcon,
  BoldIcon,
  BulletListIcon,
  HorizontalRuleIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  LoadingSpinnerIcon,
  OrderedListIcon,
  RedoIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
} from '../RichTextEditorIcons';
import Tooltip from '../Tooltip';
import ViewModeToggle, { EditorViewMode } from './ViewModeToggle';

export interface ToolbarState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | null;
  bulletList?: boolean;
  orderedList?: boolean;
  textAlign?: 'left' | 'center' | 'right' | null;
  blockquote?: boolean;
  codeBlock?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  inTable?: boolean;
}

export interface ToolbarCommands {
  toggleBold(): void;
  toggleItalic(): void;
  toggleUnderline(): void;
  toggleStrike(): void;
  toggleInlineCode(): void;
  toggleHeading(level: 2 | 3 | 4): void;
  toggleBulletList(): void;
  toggleOrderedList(): void;
  setTextAlign(alignment: 'left' | 'center' | 'right'): void;
  insertTable(): void;
  toggleHeaderRow(): void;
  transposeTable(): void;
  addRowAfter(): void;
  addColumnAfter(): void;
  deleteRow(): void;
  deleteColumn(): void;
  deleteTable(): void;
  toggleBlockquote(): void;
  toggleCodeBlock(): void;
  insertHorizontalRule(): void;
  addLink(): void;
  addImage(): void;
  undo(): void;
  redo(): void;
}

export interface ToolbarProps {
  state: ToolbarState;
  commands: ToolbarCommands;
  mode: EditorViewMode;
  onModeChange: (mode: EditorViewMode) => void;
  className?: string;
  hideWiki?: boolean;
  isUploadingImage?: boolean;
}

const ToolbarButton = React.memo(function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
  mode,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  mode: EditorViewMode;
}) {
  const button = (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || mode !== 'rich'}
      className={clsx(
        'inline-flex h-8 items-center justify-center rounded-md border p-2 text-sm font-medium transition-all duration-200',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
          : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
      )}
    >
      {children}
    </button>
  );

  if (title) {
    return (
      <Tooltip content={title} asChild>
        {button}
      </Tooltip>
    );
  }

  return button;
});

export const Toolbar = React.memo(function Toolbar({
  state,
  commands,
  mode,
  onModeChange,
  className,
  hideWiki,
  isUploadingImage,
}: ToolbarProps) {
  const [showTableTools, setShowTableTools] = useState(false);

  return (
    <div
      className={clsx(
        'border-b border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800/50',
        className
      )}
    >
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={commands.toggleBold}
            isActive={!!state.bold}
            title='粗体 (Ctrl+B)'
            mode={mode}
          >
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={commands.toggleItalic}
            isActive={!!state.italic}
            title='斜体 (Ctrl+I)'
            mode={mode}
          >
            <ItalicIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={commands.toggleUnderline}
            isActive={!!state.underline}
            title='下划线 (Ctrl+U)'
            mode={mode}
          >
            <UnderlineIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={commands.toggleStrike}
            isActive={!!state.strike}
            title='删除线 (Ctrl+Shift+S)'
            mode={mode}
          >
            <StrikethroughIcon />
          </ToolbarButton>
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => commands.toggleHeading(2)}
            isActive={state.headingLevel === 2}
            title='二级标题 (Ctrl+Alt+2) （注：实际是顶级标题，因为“一级标题”是文章标题）'
            mode={mode}
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleHeading(3)}
            isActive={state.headingLevel === 3}
            title='三级标题 (Ctrl+Alt+3)'
            mode={mode}
          >
            H3
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleHeading(4)}
            isActive={state.headingLevel === 4}
            title='四级标题 (Ctrl+Alt+4)'
            mode={mode}
          >
            H4
          </ToolbarButton>
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={commands.toggleBulletList}
            isActive={!!state.bulletList}
            title='无序列表 (Ctrl+Shift+8)'
            mode={mode}
          >
            <BulletListIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={commands.toggleOrderedList}
            isActive={!!state.orderedList}
            title='有序列表 (Ctrl+Shift+7)'
            mode={mode}
          >
            <OrderedListIcon />
          </ToolbarButton>
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => commands.setTextAlign('left')}
            isActive={state.textAlign === 'left'}
            title='左对齐'
            mode={mode}
          >
            <AlignLeftIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.setTextAlign('center')}
            isActive={state.textAlign === 'center'}
            title='居中对齐'
            mode={mode}
          >
            <AlignCenterIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.setTextAlign('right')}
            isActive={state.textAlign === 'right'}
            title='右对齐'
            mode={mode}
          >
            <AlignRightIcon />
          </ToolbarButton>
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <div className='flex items-center gap-1'>
          <ToolbarButton onClick={commands.insertTable} title='插入表格 (3x3)' mode={mode}>
            表格
          </ToolbarButton>
          <Tooltip content={showTableTools ? '收起表格工具' : '展开表格工具'} asChild>
            <button
              type='button'
              onClick={() => setShowTableTools((v) => !v)}
              aria-pressed={showTableTools}
              aria-label={showTableTools ? '收起表格工具' : '展开表格工具'}
              className={clsx(
                'rounded p-1',
                'border-0 bg-transparent',
                'hover:bg-gray-100 dark:hover:bg-gray-700',
                'focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none'
              )}
            >
              <svg
                viewBox='0 0 20 20'
                fill='currentColor'
                className={clsx(
                  'h-4 w-4 transition-transform',
                  showTableTools ? 'rotate-90' : 'rotate-0'
                )}
                aria-hidden='true'
              >
                <path d='M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06L8.29 14.77a.75.75 0 01-1.08-.02z' />
              </svg>
            </button>
          </Tooltip>
          {showTableTools && (
            <>
              <ToolbarButton onClick={commands.toggleHeaderRow} title='开关表头行' mode={mode}>
                表头
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.transposeTable}
                title='转置当前表格（沿对角线翻转）'
                mode={mode}
              >
                转置
              </ToolbarButton>
              <ToolbarButton onClick={commands.addRowAfter} title='在下方添加行' mode={mode}>
                加行
              </ToolbarButton>
              <ToolbarButton onClick={commands.addColumnAfter} title='在右侧添加列' mode={mode}>
                加列
              </ToolbarButton>
              <ToolbarButton onClick={commands.deleteRow} title='删除当前行' mode={mode}>
                删行
              </ToolbarButton>
              <ToolbarButton onClick={commands.deleteColumn} title='删除当前列' mode={mode}>
                删列
              </ToolbarButton>
              <ToolbarButton onClick={commands.deleteTable} title='删除表格' mode={mode}>
                删表
              </ToolbarButton>
            </>
          )}
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={commands.toggleBlockquote}
            isActive={!!state.blockquote}
            title='引用块 (Ctrl+Shift+B)'
            mode={mode}
          >
            <BlockquoteIcon />
          </ToolbarButton>
          <ToolbarButton onClick={commands.insertHorizontalRule} title='插入分隔线' mode={mode}>
            <HorizontalRuleIcon />
          </ToolbarButton>
          <ToolbarButton onClick={commands.addLink} title='插入链接' mode={mode}>
            <LinkIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={commands.addImage}
            title={isUploadingImage ? '图片上传中...' : '插入图片'}
            mode={mode}
            disabled={!!isUploadingImage}
          >
            {isUploadingImage ? (
              <LoadingSpinnerIcon className='size-4 animate-spin' />
            ) : (
              <ImageIcon />
            )}
          </ToolbarButton>
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={commands.undo}
            disabled={!state.canUndo}
            title='撤销 (Ctrl+Z)'
            mode={mode}
          >
            <UndoIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={commands.redo}
            disabled={!state.canRedo}
            title='重做 (Ctrl+Y)'
            mode={mode}
          >
            <RedoIcon />
          </ToolbarButton>
        </div>

        <div className='h-6 w-px bg-gray-300 dark:bg-gray-600' />

        <ViewModeToggle
          mode={mode}
          onChange={onModeChange}
          hideWiki={hideWiki ?? (process.env.NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR ? true : false)}
        />
      </div>
    </div>
  );
});

export default Toolbar;
