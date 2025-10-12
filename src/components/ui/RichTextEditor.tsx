import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import React, { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import clsx from 'clsx';
import { htmlToWikiText, wikiTextToHTML } from '@/lib/richTextUtils';
import { cleanHTMLForExport } from '@/lib/richtext/htmlTransforms';
import Toolbar, { ToolbarCommands, ToolbarState } from './RichTextEditor/Toolbar';
import { LoadingSpinnerIcon } from './RichTextEditorIcons';

// conversion helpers moved to '@/lib/richtext/htmlTransforms'

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

// inline Toolbar removed; using decoupled Toolbar component

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '',
  className,
}) => {
  const [viewMode, setViewMode] = useState<'rich' | 'wiki' | 'html'>('rich');
  const [rawContent, setRawContent] = useState('');
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    code: false,
    headingLevel: null,
    bulletList: false,
    orderedList: false,
    textAlign: null,
    blockquote: false,
    codeBlock: false,
    canUndo: false,
    canRedo: false,
    inTable: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Exclude extensions we want to configure separately
        link: false,
      }),
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

  // derive toolbar state on selection/transaction changes
  useEffect(() => {
    if (!editor) return;
    let raf = 0 as number;
    const compute = (): ToolbarState => {
      let headingLevel: ToolbarState['headingLevel'] = null;
      for (const level of [1, 2, 3] as const) {
        if (editor.isActive('heading', { level })) {
          headingLevel = level;
          break;
        }
      }
      let textAlign: ToolbarState['textAlign'] = null;
      if (editor.isActive({ textAlign: 'left' })) textAlign = 'left';
      else if (editor.isActive({ textAlign: 'center' })) textAlign = 'center';
      else if (editor.isActive({ textAlign: 'right' })) textAlign = 'right';
      return {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        code: editor.isActive('code'),
        headingLevel,
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        textAlign,
        blockquote: editor.isActive('blockquote'),
        codeBlock: editor.isActive('codeBlock'),
        canUndo: editor.can().undo(),
        canRedo: editor.can().redo(),
        inTable:
          editor.isActive('table') ||
          editor.isActive('tableCell') ||
          editor.isActive('tableHeader'),
      };
    };
    const update = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setToolbarState(compute()));
    };
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    update();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  // commands bound to editor
  const transposeTable = useCallback(() => {
    if (!editor) return;
    const { state, view } = editor;
    const { $from } = state.selection;
    let tableDepth = -1;
    for (let d = $from.depth; d >= 0; d--) {
      const n = $from.node(d);
      if (n && n.type && n.type.name === 'table') {
        tableDepth = d;
        break;
      }
    }
    if (tableDepth === -1) return;
    const tableNode = $from.node(tableDepth) as PMNode;
    const startPos = $from.before(tableDepth);
    const endPos = $from.after(tableDepth);
    const rows: PMNode[][] = [];
    let maxCols = 0;
    let hasSpan = false;
    tableNode.forEach((row: PMNode) => {
      if (row.type.name !== 'tableRow') return;
      const cells: PMNode[] = [];
      row.forEach((cell: PMNode) => {
        const name = cell.type.name;
        if (name !== 'tableCell' && name !== 'tableHeader') return;
        const colspanVal = (cell.attrs && (cell.attrs as Record<string, unknown>)['colspan']) as
          | number
          | undefined;
        const rowspanVal = (cell.attrs && (cell.attrs as Record<string, unknown>)['rowspan']) as
          | number
          | undefined;
        const colspan = typeof colspanVal === 'number' ? colspanVal : 1;
        const rowspan = typeof rowspanVal === 'number' ? rowspanVal : 1;
        if (colspan > 1 || rowspan > 1) {
          hasSpan = true;
        }
        cells.push(cell);
      });
      maxCols = Math.max(maxCols, cells.length);
      rows.push(cells);
    });
    if (hasSpan) {
      window.alert('暂不支持包含合并单元格的表格进行转置');
      return;
    }
    const schema = state.schema;
    const tableRowType = schema.nodes.tableRow!;
    const tableCellType = schema.nodes.tableCell!;
    const tableHeaderType = schema.nodes.tableHeader!;
    const paragraphType = schema.nodes.paragraph!;
    if (!tableRowType || !tableCellType || !tableHeaderType || !paragraphType) {
      window.alert('转置失败：编辑器表格节点类型不可用');
      return;
    }
    const hasHeaderRow =
      rows.length > 0 &&
      rows[0] &&
      rows[0]!.length > 0 &&
      rows[0]!.every((c) => c && c.type === tableHeaderType);
    const hasHeaderCol =
      rows.length > 0 && rows.every((r) => r[0] && r[0]!.type === tableHeaderType);
    const makeCellLike = (source: PMNode | undefined, forceHeader: boolean): PMNode => {
      if (!source) {
        const filled = tableCellType.createAndFill();
        return filled ?? tableCellType.create({}, paragraphType.create());
      }
      if (forceHeader || source.type === tableHeaderType) {
        return tableHeaderType.create(source.attrs ?? {}, source.content);
      }
      return tableCellType.create(source.attrs ?? {}, source.content);
    };
    const newRowNodes: PMNode[] = [];
    for (let c = 0; c < maxCols; c++) {
      const newCells: PMNode[] = [];
      for (let r = 0; r < rows.length; r++) {
        const sourceCell = rows[r]?.[c];
        const forceHeader = c === 0 && (hasHeaderRow || hasHeaderCol);
        newCells.push(makeCellLike(sourceCell, forceHeader));
      }
      const rowNode = tableRowType.create({}, newCells);
      newRowNodes.push(rowNode);
    }
    const newTable = tableNode.type.create(tableNode.attrs ?? {}, newRowNodes);
    const tr = state.tr.replaceWith(startPos, endPos, newTable);
    view.dispatch(tr.scrollIntoView());
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('图片链接');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('链接地址', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const commands: ToolbarCommands = {
    toggleBold: useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]),
    toggleItalic: useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]),
    toggleUnderline: useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]),
    toggleStrike: useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]),
    toggleInlineCode: useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]),
    toggleHeading: useCallback(
      (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run(),
      [editor]
    ),
    toggleBulletList: useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]),
    toggleOrderedList: useCallback(
      () => editor?.chain().focus().toggleOrderedList().run(),
      [editor]
    ),
    setTextAlign: useCallback(
      (alignment) => editor?.chain().focus().setTextAlign(alignment).run(),
      [editor]
    ),
    insertTable: useCallback(
      () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      [editor]
    ),
    toggleHeaderRow: useCallback(() => editor?.chain().focus().toggleHeaderRow().run(), [editor]),
    transposeTable,
    addRowAfter: useCallback(() => editor?.chain().focus().addRowAfter().run(), [editor]),
    addColumnAfter: useCallback(() => editor?.chain().focus().addColumnAfter().run(), [editor]),
    deleteRow: useCallback(() => editor?.chain().focus().deleteRow().run(), [editor]),
    deleteColumn: useCallback(() => editor?.chain().focus().deleteColumn().run(), [editor]),
    deleteTable: useCallback(() => editor?.chain().focus().deleteTable().run(), [editor]),
    toggleBlockquote: useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]),
    toggleCodeBlock: useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor]),
    insertHorizontalRule: useCallback(
      () => editor?.chain().focus().setHorizontalRule().scrollIntoView().run(),
      [editor]
    ),
    addLink,
    addImage,
    undo: useCallback(() => editor?.chain().focus().undo().run(), [editor]),
    redo: useCallback(() => editor?.chain().focus().redo().run(), [editor]),
  };

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
      <Toolbar
        state={toolbarState}
        commands={commands}
        mode={viewMode}
        onModeChange={handleModeChange}
      />
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
