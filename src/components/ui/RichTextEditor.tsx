import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import clsx from 'clsx';
import { htmlToWikiText, wikiTextToHTML } from '@/lib/richTextUtils';
import { cleanHTMLForExport } from '@/lib/richtext/htmlTransforms';
import {
  describeAllowedImageSources,
  normalizeHostedImageUrl,
  RTE_IMAGE_ALLOWED_MIME_TYPES,
  RTE_IMAGE_MAX_BYTES,
  stripDisallowedImages,
} from '@/lib/richtext/imagePolicy';
import Toolbar, { ToolbarCommands, ToolbarState } from './RichTextEditor/Toolbar';
import { LoadingSpinnerIcon } from './RichTextEditorIcons';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const ACCEPTED_MIME_STRING = RTE_IMAGE_ALLOWED_MIME_TYPES.join(',');

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

// inline Toolbar removed; using decoupled Toolbar component

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = '',
  className,
}) => {
  const sanitizedPlaceholder = useMemo(() => stripDisallowedImages(placeholder), [placeholder]);
  const sanitizedContent = useMemo(() => stripDisallowedImages(content ?? ''), [content]);
  const initialHtml = sanitizedContent || sanitizedPlaceholder;

  const [viewMode, setViewMode] = useState<'rich' | 'wiki' | 'html'>('rich');
  const [rawContent, setRawContent] = useState(initialHtml);
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = stripDisallowedImages(html);
      if (sanitized !== html) {
        editor.commands.setContent(sanitized, { emitUpdate: false });
      }
      onChange?.(sanitized);
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
    if (!editor) return;
    const target = sanitizedContent || sanitizedPlaceholder || '';
    const current = stripDisallowedImages(editor.getHTML());
    if (target !== current) {
      editor.commands.setContent(target, { emitUpdate: true });
    }
  }, [editor, sanitizedContent, sanitizedPlaceholder]);

  useEffect(() => {
    const target = sanitizedContent || sanitizedPlaceholder || '';
    if (viewMode === 'wiki') {
      const wiki = htmlToWikiText(target);
      setRawContent((prev) => (prev === wiki ? prev : wiki));
    } else if (viewMode === 'html') {
      setRawContent((prev) => (prev === target ? prev : target));
    }
  }, [sanitizedContent, sanitizedPlaceholder, viewMode]);

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

  const allowedImageSourcesText = useMemo(() => describeAllowedImageSources(), []);

  const addImage = useCallback(() => {
    if (!editor) return;

    const manualUrl = window.prompt(
      `请输入${allowedImageSourcesText}的图片地址，留空以从本地上传。`
    );
    if (manualUrl === null) {
      return;
    }

    if (manualUrl.trim()) {
      const normalized = normalizeHostedImageUrl(manualUrl);
      if (!normalized) {
        window.alert(`仅允许使用 ${allowedImageSourcesText}`);
        return;
      }
      editor.chain().focus().setImage({ src: normalized }).run();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_MIME_STRING;
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      input.value = '';
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    input.addEventListener(
      'blur',
      () => {
        // defer so change handler (if any) runs first
        setTimeout(() => {
          cleanup();
        }, 0);
      },
      { once: true }
    );

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        cleanup();
        return;
      }
      if (!RTE_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) {
        window.alert('仅支持上传 PNG、JPEG、WEBP、AVIF 或 GIF 图片');
        cleanup();
        return;
      }
      if (file.size > RTE_IMAGE_MAX_BYTES) {
        window.alert(
          `图片大小需小于 ${formatBytes(RTE_IMAGE_MAX_BYTES)}，当前为 ${formatBytes(file.size)}`
        );
        cleanup();
        return;
      }

      const formData = new FormData();
      formData.append('file', file, file.name);
      setIsUploadingImage(true);

      fetch('/api/uploads/rte-image', {
        method: 'POST',
        body: formData,
      })
        .then(async (response) => {
          if (!response.ok) {
            const message = await response.text();
            throw new Error(message || '上传失败');
          }
          return response.json() as Promise<{ publicUrl: string }>;
        })
        .then(({ publicUrl }) => {
          const normalized = normalizeHostedImageUrl(publicUrl);
          if (!normalized) {
            throw new Error('上传的图片地址未通过安全校验');
          }
          editor.chain().focus().setImage({ src: normalized }).run();
        })
        .catch((error) => {
          console.error('上传图片失败', error);
          window.alert('上传图片失败，请稍后重试或联系管理员。');
        })
        .finally(() => {
          setIsUploadingImage(false);
          cleanup();
        });
    };

    setTimeout(() => {
      input.click();
    }, 0);
  }, [editor, allowedImageSourcesText]);

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
        const sanitizedHtml = stripDisallowedImages(rawContent);
        setRawContent(htmlToWikiText(sanitizedHtml));
      } else if (viewMode === 'rich') {
        const currentHtml = stripDisallowedImages(editor.getHTML());
        setRawContent(htmlToWikiText(currentHtml));
      }
    } else if (mode === 'html') {
      if (viewMode === 'wiki') {
        const htmlFromWiki = stripDisallowedImages(wikiTextToHTML(rawContent));
        setRawContent(cleanHTMLForExport(htmlFromWiki));
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
      const sanitizedHtml = stripDisallowedImages(newHtml);
      editor.commands.setContent(sanitizedHtml, { emitUpdate: true });
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
        isUploadingImage={isUploadingImage}
      />
      {viewMode === 'rich' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          value={rawContent}
          onChange={(e) => {
            const value = e.target.value;
            if (viewMode === 'wiki') {
              setRawContent(value);
              const convertedHTML = stripDisallowedImages(wikiTextToHTML(value));
              onChange?.(convertedHTML);
            } else {
              const sanitizedHtml = stripDisallowedImages(value);
              setRawContent(sanitizedHtml);
              onChange?.(sanitizedHtml);
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
