import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import type { Node as PMNode } from '@tiptap/pm/model';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';

import { cleanHTMLForExport } from '@/lib/richtext/htmlTransforms';
import {
  describeAllowedImageSources,
  normalizeHostedImageUrl,
  RTE_IMAGE_ALLOWED_MIME_TYPES,
  RTE_IMAGE_MAX_BYTES,
  stripDisallowedImages,
} from '@/lib/richtext/imagePolicy';
import { htmlToWikiText, wikiTextToHTML } from '@/lib/richTextUtils';

import ImagePickerModal from './RichTextEditor/ImagePickerModal';
import Toolbar, { ToolbarCommands, ToolbarState } from './RichTextEditor/Toolbar';
import { LoadingSpinnerIcon } from './RichTextEditorIcons';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

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
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  const uploadImageFile = useCallback(async (file: File) => {
    if (!RTE_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('仅支持上传 PNG、JPEG、WEBP、AVIF 或 GIF 图片');
    }
    if (file.size > RTE_IMAGE_MAX_BYTES) {
      throw new Error(
        `图片大小需小于 ${formatBytes(RTE_IMAGE_MAX_BYTES)}，当前为 ${formatBytes(file.size)}`
      );
    }

    const formData = new FormData();
    formData.append('file', file, file.name);
    setIsUploadingImage(true);

    try {
      const response = await fetch('/api/uploads/rte-image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        try {
          const payload = JSON.parse(text) as { error?: string };
          throw new Error(payload.error || '上传失败');
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new Error(text || '上传失败');
          }
          throw error;
        }
      }
      const result = (await response.json()) as { publicUrl?: string };
      if (!result?.publicUrl) {
        throw new Error('上传失败，未返回图片地址');
      }
      const normalized = normalizeHostedImageUrl(result.publicUrl);
      if (!normalized) {
        throw new Error('上传的图片地址未通过安全校验');
      }
      setLibraryRefreshKey((key) => key + 1);
      return normalized;
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

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
      for (const level of [2, 3, 4] as const) {
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
    setShowImagePicker(true);
  }, [editor]);

  const handleImagePicked = useCallback(
    (url: string) => {
      const normalized = normalizeHostedImageUrl(url) ?? (url.startsWith('/') ? url : null);
      if (!normalized) {
        window.alert('选取的图片地址未通过安全校验，请联系管理员。');
        return;
      }
      editor?.chain().focus().setImage({ src: normalized }).run();
      setShowImagePicker(false);
    },
    [editor]
  );

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

  const handlePastedImages = useCallback(
    async (files: File[]) => {
      if (!editor || files.length === 0) return;
      for (const file of files) {
        try {
          const imageUrl = await uploadImageFile(file);
          editor.chain().focus().setImage({ src: imageUrl }).run();
        } catch (error) {
          const message = error instanceof Error ? error.message : '图片上传失败，请稍后重试。';
          window.alert(message);
          break;
        }
      }
    },
    [editor, uploadImageFile]
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (viewMode !== 'rich' || !editor) return;
      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      const candidateFiles: File[] = [];

      if (clipboardData.items && clipboardData.items.length > 0) {
        for (const item of Array.from(clipboardData.items)) {
          if (item.kind !== 'file') continue;
          const file = item.getAsFile();
          if (file) {
            candidateFiles.push(file);
          }
        }
      }

      if (candidateFiles.length === 0 && clipboardData.files && clipboardData.files.length > 0) {
        candidateFiles.push(...Array.from(clipboardData.files));
      }

      const imageFiles = candidateFiles.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      event.preventDefault();

      const allowedImages = imageFiles.filter((file) =>
        RTE_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)
      );
      const disallowedImages = imageFiles.filter(
        (file) => !RTE_IMAGE_ALLOWED_MIME_TYPES.includes(file.type)
      );

      if (allowedImages.length === 0) {
        window.alert('仅支持粘贴 PNG、JPEG、WEBP、AVIF 或 GIF 图片。');
        return;
      }

      void handlePastedImages(allowedImages);

      if (disallowedImages.length > 0) {
        window.alert('部分图片格式不受支持，仅处理了 PNG、JPEG、WEBP、AVIF 或 GIF 图片。');
      }
    },
    [editor, handlePastedImages, viewMode]
  );

  const commands: ToolbarCommands = {
    toggleBold: useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]),
    toggleItalic: useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]),
    toggleUnderline: useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]),
    toggleStrike: useCallback(() => editor?.chain().focus().toggleStrike().run(), [editor]),
    toggleInlineCode: useCallback(() => editor?.chain().focus().toggleCode().run(), [editor]),
    toggleHeading: useCallback(
      (level: 2 | 3 | 4) => editor?.chain().focus().toggleHeading({ level }).run(),
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
      <div className='rounded-lg border border-gray-300 dark:border-gray-600'>
        <div className='flex items-center justify-center p-6 text-gray-500 dark:text-gray-400'>
          <LoadingSpinnerIcon />
          加载编辑器...
        </div>
      </div>
    );
  }

  return (
    <div className='flex max-h-[90vh] flex-col overflow-hidden rounded-lg border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900'>
      <Toolbar
        state={toolbarState}
        commands={commands}
        mode={viewMode}
        onModeChange={handleModeChange}
        isUploadingImage={isUploadingImage}
        className='z-10 flex-none'
      />
      <ImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onSelect={handleImagePicked}
        onUpload={uploadImageFile}
        isUploading={isUploadingImage}
        allowedSourcesDescription={allowedImageSourcesText}
        refreshLibraryKey={libraryRefreshKey}
      />
      <div className='min-h-0 flex-1 overflow-y-auto'>
        {viewMode === 'rich' ? (
          <EditorContent editor={editor} onPaste={handlePaste} />
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
              'h-full min-h-[400px] w-full bg-gray-50 p-6 text-gray-900 dark:bg-gray-800 dark:text-gray-100',
              'resize-none font-mono text-sm focus:outline-none',
              className
            )}
            aria-label={viewMode === 'wiki' ? 'WikiText editor' : 'HTML editor'}
          />
        )}
      </div>
    </div>
  );
};

export default RichTextEditor;
