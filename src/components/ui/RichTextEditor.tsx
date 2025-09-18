import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import React, { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import clsx from 'clsx';
import { htmlToWikiText, wikiTextToHTML } from '@/lib/richTextUtils';
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
  UndoIcon,
  RedoIcon,
  LoadingSpinnerIcon,
} from './RichTextEditorIcons';

// Normalize editor-produced HTML for display/export, especially tables.
function cleanHTMLForExport(html: string): string {
  let out = html;
  // Remove colgroup added by resizable tables
  out = out.replace(/<colgroup>[\s\S]*?<\/colgroup>/gi, '');
  // Strip inline styles on table tag (e.g., min-width)
  out = out.replace(/<table\b([^>]*?)\sstyle="[^"]*"/gi, '<table$1');
  // Unwrap <p> inside table cells: <td><p>..</p></td> -> <td>..</td>
  out = out.replace(/<(td|th)([^>]*)>\s*<p>([\s\S]*?)<\/p>\s*<\/\1>/gi, '<$1$2>$3</$1>');
  // Remove empty <p> right after or before table
  out = out.replace(/<table([^>]*)>\s*<p>\s*<\/p>/gi, '<table$1>');
  out = out.replace(/<\/table>\s*<p>\s*<\/p>/gi, '</table>');
  // Remove default colspan/rowspan="1"
  out = out.replace(/\s(colspan|rowspan)="1"/gi, '');
  // Remove tbody wrapper for simpler markup (optional)
  out = out.replace(/<\/?tbody>/gi, '');
  // Pretty print: add newlines for readability
  // Ensure newline between preceding block and table
  out = out.replace(/<\/(p|div|section|article|h[1-6])>\s*<table/gi, '</$1>\n<table');
  out = out.replace(/<table(\b[^>]*)>/gi, '<table$1>\n');
  out = out.replace(/<\/table>/gi, '\n</table>');
  // One newline before <tr>, none after, to avoid blank line before first cell
  out = out.replace(/<tr(\b[^>]*)>/gi, '\n<tr$1>');
  // One newline before closing </tr>, none after; next <tr> adds its own newline
  out = out.replace(/<\/(tr)>/gi, '\n</$1>');
  out = out.replace(/<(th|td)(\b[^>]*)>/gi, '\n<$1$2>');
  out = out.replace(/<\/(th|td)>/gi, '</$1>\n');
  // Collapse excessive blank lines
  out = out.replace(/\n{2,}/g, '\n');
  // Trim spaces between tags lines
  out = out
    .split('\n')
    .map((l) => l.trimEnd())
    .join('\n')
    .trim();
  return out;
}

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton = React.memo<ToolbarButtonProps>(
  ({ onClick, isActive = false, disabled = false, children, title }) => (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'p-2 rounded-md border transition-all duration-200 text-sm font-medium',
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
  )
);
ToolbarButton.displayName = 'ToolbarButton';

const Toolbar: React.FC<{
  editor: Editor;
  viewMode: string;
  onModeChange: (mode: 'rich' | 'wiki' | 'html') => void;
}> = ({ editor, viewMode, onModeChange }) => {
  const addImage = useCallback(() => {
    const url = window.prompt('图片链接');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('链接地址', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className='border-b border-gray-300 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-800/50'>
      <div className='flex flex-wrap items-center gap-2'>
        {/* Text Formatting */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title='粗体 (Ctrl+B)'
          >
            <BoldIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title='斜体 (Ctrl+I)'
          >
            <ItalicIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title='下划线 (Ctrl+U)'
          >
            <UnderlineIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title='删除线'
          >
            <StrikethroughIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title='行内代码'
          >
            <InlineCodeIcon />
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* Headings */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title='标题 1'
          >
            H1
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title='标题 2'
          >
            H2
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title='标题 3'
          >
            H3
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* Lists */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title='无序列表'
          >
            <BulletListIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title='有序列表'
          >
            <OrderedListIcon />
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* Alignment */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title='左对齐'
          >
            <AlignLeftIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title='居中对齐'
          >
            <AlignCenterIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title='右对齐'
          >
            <AlignRightIcon />
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* Tables */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            disabled={
              !editor
                .can()
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            title='插入表格 (3x3)'
          >
            表格
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            disabled={!editor.can().chain().focus().toggleHeaderRow().run()}
            title='开关表头行'
          >
            表头
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().addRowAfter().run()}
            disabled={!editor.can().chain().focus().addRowAfter().run()}
            title='在下方添加行'
          >
            加行
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            disabled={!editor.can().chain().focus().addColumnAfter().run()}
            title='在右侧添加列'
          >
            加列
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteRow().run()}
            disabled={!editor.can().chain().focus().deleteRow().run()}
            title='删除当前行'
          >
            删行
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteColumn().run()}
            disabled={!editor.can().chain().focus().deleteColumn().run()}
            title='删除当前列'
          >
            删列
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().mergeCells().run()}
            disabled={!editor.can().chain().focus().mergeCells().run()}
            title='合并单元格'
          >
            合并
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().splitCell().run()}
            disabled={!editor.can().chain().focus().splitCell().run()}
            title='拆分单元格'
          >
            拆分
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().chain().focus().deleteTable().run()}
            title='删除表格'
          >
            删表
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* Special Content */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title='引用'
          >
            <BlockquoteIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title='代码块'
          >
            <CodeBlockIcon />
          </ToolbarButton>

          <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title='插入链接'>
            <LinkIcon />
          </ToolbarButton>

          <ToolbarButton onClick={addImage} title='插入图片'>
            <ImageIcon />
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* Undo/Redo */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title='撤销 (Ctrl+Z)'
          >
            <UndoIcon />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title='重做 (Ctrl+Y)'
          >
            <RedoIcon />
          </ToolbarButton>
        </div>

        <div className='w-px h-6 bg-gray-300 dark:bg-gray-600' />

        {/* View Switcher */}
        <div className='flex items-center gap-1'>
          <ToolbarButton
            onClick={() => onModeChange('rich')}
            isActive={viewMode === 'rich'}
            title='富文本'
          >
            Rich
          </ToolbarButton>
          <ToolbarButton
            onClick={() => onModeChange('html')}
            isActive={viewMode === 'html'}
            title='HTML'
          >
            HTML
          </ToolbarButton>
          {!process.env.NEXT_PUBLIC_DISABLE_WIKITEXT_EDITOR && (
            <ToolbarButton
              onClick={() => onModeChange('wiki')}
              isActive={viewMode === 'wiki'}
              title='WikiText'
            >
              WikiText (实验性功能)
            </ToolbarButton>
          )}
        </div>
      </div>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '',
  className,
}) => {
  const [viewMode, setViewMode] = useState<'rich' | 'wiki' | 'html'>('rich');
  const [rawContent, setRawContent] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude extensions we want to configure separately
        link: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            'text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      // Table support to preserve and edit tables in rich mode
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || placeholder,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: clsx(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none',
          'dark:prose-invert',
          'focus:outline-none',
          'p-6 min-h-[400px]',
          'text-gray-900 dark:text-gray-100',
          className
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && placeholder && placeholder !== editor.getHTML()) {
      editor.commands.setContent(placeholder, { emitUpdate: true });
    }
  }, [placeholder, editor]);

  useEffect(() => {
    setRawContent(placeholder);
  }, [placeholder]);

  const handleModeChange = (mode: 'rich' | 'wiki' | 'html') => {
    if (!editor) return;

    if (mode === viewMode) return;

    // Determine conversions based on current view
    if (mode === 'wiki') {
      if (viewMode === 'html') {
        setRawContent(htmlToWikiText(rawContent));
      } else if (viewMode === 'rich') {
        const currentHtml = editor.getHTML();
        setRawContent(htmlToWikiText(currentHtml));
      }
    } else if (mode === 'html') {
      if (viewMode === 'wiki') {
        setRawContent(wikiTextToHTML(rawContent));
      } else if (viewMode === 'rich') {
        const currentHtml = editor.getHTML();
        setRawContent(cleanHTMLForExport(currentHtml));
      }
    } else {
      // Switching back to rich text
      let newHtml = rawContent;
      if (viewMode === 'wiki') {
        newHtml = wikiTextToHTML(rawContent);
      }
      // If coming from HTML view, rawContent already holds HTML
      editor.commands.setContent(newHtml, { emitUpdate: true });
    }
    setViewMode(mode);
  };

  if (!editor) {
    return (
      <div className='border border-gray-300 dark:border-gray-600 rounded-lg'>
        <div className='p-6 flex items-center justify-center text-gray-500 dark:text-gray-400'>
          <LoadingSpinnerIcon />
          加载编辑器...
        </div>
      </div>
    );
  }

  return (
    <div className='border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 overflow-hidden'>
      <Toolbar editor={editor} viewMode={viewMode} onModeChange={handleModeChange} />
      {viewMode === 'rich' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          value={rawContent}
          onChange={(e) => {
            setRawContent(e.target.value);
            if (viewMode === 'wiki') {
              const convertedHTML = wikiTextToHTML(e.target.value);
              onChange?.(convertedHTML);
            }
            if (viewMode === 'html') {
              onChange?.(e.target.value);
            }
          }}
          className={clsx(
            'w-full h-full p-6 min-h-[400px] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'font-mono text-sm focus:outline-none',
            className
          )}
          aria-label={viewMode === 'wiki' ? 'WikiText editor' : 'HTML editor'}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
