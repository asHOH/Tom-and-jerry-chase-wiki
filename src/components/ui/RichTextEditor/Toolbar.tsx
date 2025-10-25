import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  InlineCodeIcon,
  BulletListIcon,
  OrderedListIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  BlockquoteIcon,
  CodeBlockIcon,
  LinkIcon,
  ImageIcon,
  HorizontalRuleIcon,
  UndoIcon,
  RedoIcon,
  LoadingSpinnerIcon,
} from '../RichTextEditorIcons';
import ViewModeToggle, { EditorViewMode } from './ViewModeToggle';
import { useMobile } from '../../../hooks/useMediaQuery';
import { useVirtualKeyboardVisible } from '../../../hooks/useVirtualKeyboardVisible';

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
  toggleHeading(level: 1 | 2 | 3): void;
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
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled || mode !== 'rich'}
      title={title}
      className={clsx(
        'inline-flex h-8 items-center justify-center p-2 rounded-md border transition-all duration-200 text-sm font-medium',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
      )}
    >
      {children}
    </button>
  );
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
  const [isClient, setIsClient] = useState(false);
  const isMobile = useMobile();
  const isKeyboardVisible = useVirtualKeyboardVisible();
  const shouldBeSticky = isMobile && isKeyboardVisible;
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const commonButtonProps = {
    mode,
    isMobile: shouldBeSticky,
  };

  const toolbarContent = (
    <div
      className={clsx(
        className,
        shouldBeSticky
          ? 'fixed bottom-0 left-0 right-0 z-[100] border-t bg-gray-50/95 p-2 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95'
          : 'border-b border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      <div
        className={clsx(
          'flex items-center gap-2',
          shouldBeSticky ? 'flex-nowrap overflow-x-auto p-1' : 'flex-wrap'
        )}
      >
        {shouldBeSticky && !showMore ? (
          <>
            <ToolbarButton
              onClick={commands.toggleBold}
              isActive={!!state.bold}
              title='粗体'
              {...commonButtonProps}
            >
              <BoldIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={commands.toggleItalic}
              isActive={!!state.italic}
              title='斜体'
              {...commonButtonProps}
            >
              <ItalicIcon />
            </ToolbarButton>
            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />
            <ToolbarButton
              onClick={commands.toggleBulletList}
              isActive={!!state.bulletList}
              title='无序列表'
              {...commonButtonProps}
            >
              <BulletListIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={commands.toggleOrderedList}
              isActive={!!state.orderedList}
              title='有序列表'
              {...commonButtonProps}
            >
              <OrderedListIcon />
            </ToolbarButton>
            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />
            <ToolbarButton onClick={commands.addLink} title='插入链接' {...commonButtonProps}>
              <LinkIcon />
            </ToolbarButton>
            <ToolbarButton
              onClick={commands.addImage}
              title={isUploadingImage ? '图片上传中...' : '插入图片'}
              disabled={!!isUploadingImage}
              {...commonButtonProps}
            >
              {isUploadingImage ? (
                <LoadingSpinnerIcon className='animate-spin size-4' />
              ) : (
                <ImageIcon />
              )}
            </ToolbarButton>
            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />
            <ToolbarButton
              onClick={() => setShowMore(true)}
              title='更多工具'
              {...commonButtonProps}
            >
              ...
            </ToolbarButton>
          </>
        ) : (
          <>
            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={commands.toggleBold}
                isActive={!!state.bold}
                title='粗体 (Ctrl+B)'
                {...commonButtonProps}
              >
                <BoldIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.toggleItalic}
                isActive={!!state.italic}
                title='斜体 (Ctrl+I)'
                {...commonButtonProps}
              >
                <ItalicIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.toggleUnderline}
                isActive={!!state.underline}
                title='下划线 (Ctrl+U)'
                {...commonButtonProps}
              >
                <UnderlineIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.toggleStrike}
                isActive={!!state.strike}
                title='删除线 (Ctrl+Shift+S)'
                {...commonButtonProps}
              >
                <StrikethroughIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.toggleInlineCode}
                isActive={!!state.code}
                title='行内代码 (Ctrl+E)'
                {...commonButtonProps}
              >
                <InlineCodeIcon />
              </ToolbarButton>
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={() => commands.toggleHeading(1)}
                isActive={state.headingLevel === 1}
                title='标题 1 (Ctrl+Alt+1)'
                {...commonButtonProps}
              >
                H1
              </ToolbarButton>
              <ToolbarButton
                onClick={() => commands.toggleHeading(2)}
                isActive={state.headingLevel === 2}
                title='标题 2 (Ctrl+Alt+2)'
                {...commonButtonProps}
              >
                H2
              </ToolbarButton>
              <ToolbarButton
                onClick={() => commands.toggleHeading(3)}
                isActive={state.headingLevel === 3}
                title='标题 3 (Ctrl+Alt+3)'
                {...commonButtonProps}
              >
                H3
              </ToolbarButton>
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={commands.toggleBulletList}
                isActive={!!state.bulletList}
                title='无序列表 (Ctrl+Shift+8)'
                {...commonButtonProps}
              >
                <BulletListIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.toggleOrderedList}
                isActive={!!state.orderedList}
                title='有序列表 (Ctrl+Shift+7)'
                {...commonButtonProps}
              >
                <OrderedListIcon />
              </ToolbarButton>
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={() => commands.setTextAlign('left')}
                isActive={state.textAlign === 'left'}
                title='左对齐'
                {...commonButtonProps}
              >
                <AlignLeftIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => commands.setTextAlign('center')}
                isActive={state.textAlign === 'center'}
                title='居中对齐'
                {...commonButtonProps}
              >
                <AlignCenterIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => commands.setTextAlign('right')}
                isActive={state.textAlign === 'right'}
                title='右对齐'
                {...commonButtonProps}
              >
                <AlignRightIcon />
              </ToolbarButton>
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={commands.insertTable}
                title='插入表格 (3x3)'
                {...commonButtonProps}
              >
                表格
              </ToolbarButton>
              <button
                type='button'
                onClick={() => setShowTableTools((v) => !v)}
                title={showTableTools ? '收起表格工具' : '展开表格工具'}
                aria-pressed={showTableTools}
                className={clsx(
                  'p-1 rounded',
                  'bg-transparent border-0',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                )}
              >
                <svg
                  viewBox='0 0 20 20'
                  fill='currentColor'
                  className={clsx(
                    'w-4 h-4 transition-transform',
                    showTableTools ? 'rotate-90' : 'rotate-0'
                  )}
                  aria-hidden='true'
                >
                  <path d='M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.24 4.24a.75.75 0 010 1.06L8.29 14.77a.75.75 0 01-1.08-.02z' />
                </svg>
              </button>
              {showTableTools && (
                <>
                  <ToolbarButton
                    onClick={commands.toggleHeaderRow}
                    title='开关表头行'
                    {...commonButtonProps}
                  >
                    表头
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={commands.transposeTable}
                    title='转置当前表格（沿对角线翻转）'
                    {...commonButtonProps}
                  >
                    转置
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={commands.addRowAfter}
                    title='在下方添加行'
                    {...commonButtonProps}
                  >
                    加行
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={commands.addColumnAfter}
                    title='在右侧添加列'
                    {...commonButtonProps}
                  >
                    加列
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={commands.deleteRow}
                    title='删除当前行'
                    {...commonButtonProps}
                  >
                    删行
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={commands.deleteColumn}
                    title='删除当前列'
                    {...commonButtonProps}
                  >
                    删列
                  </ToolbarButton>
                  <ToolbarButton
                    onClick={commands.deleteTable}
                    title='删除表格'
                    {...commonButtonProps}
                  >
                    删表
                  </ToolbarButton>
                </>
              )}
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={commands.toggleBlockquote}
                isActive={!!state.blockquote}
                title='引用块 (Ctrl+Shift+B)'
                {...commonButtonProps}
              >
                <BlockquoteIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.toggleCodeBlock}
                isActive={!!state.codeBlock}
                title='代码块 (Ctrl+Alt+C)'
                {...commonButtonProps}
              >
                <CodeBlockIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.insertHorizontalRule}
                title='插入分隔线'
                {...commonButtonProps}
              >
                <HorizontalRuleIcon />
              </ToolbarButton>
              <ToolbarButton onClick={commands.addLink} title='插入链接' {...commonButtonProps}>
                <LinkIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.addImage}
                title={isUploadingImage ? '图片上传中...' : '插入图片'}
                disabled={!!isUploadingImage}
                {...commonButtonProps}
              >
                {isUploadingImage ? (
                  <LoadingSpinnerIcon className='animate-spin size-4' />
                ) : (
                  <ImageIcon />
                )}
              </ToolbarButton>
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <div className='flex items-center gap-1'>
              <ToolbarButton
                onClick={commands.undo}
                disabled={!state.canUndo}
                title='撤销 (Ctrl+Z)'
                {...commonButtonProps}
              >
                <UndoIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={commands.redo}
                disabled={!state.canRedo}
                title='重做 (Ctrl+Y)'
                {...commonButtonProps}
              >
                <RedoIcon />
              </ToolbarButton>
            </div>

            <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

            <ViewModeToggle
              mode={mode}
              onChange={onModeChange}
              hideWiki={
                hideWiki ?? (process.env.NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR ? true : false)
              }
            />
          </>
        )}
      </div>
    </div>
  );

  if (shouldBeSticky && isClient) {
    return createPortal(toolbarContent, document.body);
  }

  return toolbarContent;
});

export default Toolbar;
