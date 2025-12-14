import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorContent } from '@tiptap/react';
import clsx from 'clsx';

import { cleanHTMLForExport } from '@/lib/richtext/htmlTransforms';
import {
  describeAllowedImageSources,
  normalizeHostedImageUrl,
  RTE_IMAGE_ALLOWED_MIME_TYPES,
  stripDisallowedImages,
} from '@/lib/richtext/imagePolicy';
import { transposeTable as transposeTableUtil } from '@/lib/richtext/tableUtils';
import { htmlToWikiText, wikiTextToHTML } from '@/lib/richTextUtils';
import { useRTEConfiguration } from '@/hooks/useRTEConfiguration';
import { useRTEImageUpload } from '@/hooks/useRTEImageUpload';
import { useRTEToolbarState } from '@/hooks/useRTEToolbarState';
import { useToast } from '@/context/ToastContext';

import ImagePickerModal from './RichTextEditor/ImagePickerModal';
import LinkDialog from './RichTextEditor/LinkDialog';
import Toolbar, { ToolbarCommands } from './RichTextEditor/Toolbar';
import { LoadingSpinnerIcon } from './RichTextEditorIcons';

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
  const sanitizedPlaceholder = useMemo(() => stripDisallowedImages(placeholder), [placeholder]);
  const sanitizedContent = useMemo(() => stripDisallowedImages(content ?? ''), [content]);
  const initialHtml = sanitizedContent || sanitizedPlaceholder;

  const [viewMode, setViewMode] = useState<'rich' | 'wiki' | 'html'>('rich');
  const [rawContent, setRawContent] = useState(initialHtml);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const { isUploadingImage, libraryRefreshKey, uploadImageFile } = useRTEImageUpload();
  const { error: showError } = useToast();

  const editor = useRTEConfiguration({
    initialHtml,
    content: sanitizedContent || sanitizedPlaceholder || '',
    onChange,
    className,
  });

  const toolbarState = useRTEToolbarState(editor);

  useEffect(() => {
    const target = sanitizedContent || sanitizedPlaceholder || '';
    if (viewMode === 'wiki') {
      const wiki = htmlToWikiText(target);
      setRawContent((prev) => (prev === wiki ? prev : wiki));
    } else if (viewMode === 'html') {
      setRawContent((prev) => (prev === target ? prev : target));
    }
  }, [sanitizedContent, sanitizedPlaceholder, viewMode]);

  // commands bound to editor
  const transposeTable = useCallback(() => {
    transposeTableUtil(editor);
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
        showError('选取的图片地址未通过安全校验，请联系管理员。');
        return;
      }
      editor?.chain().focus().setImage({ src: normalized }).run();
      setShowImagePicker(false);
    },
    [editor, showError]
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    setShowLinkDialog(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(
    (url: string) => {
      if (!editor) return;
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
    [editor]
  );

  const handlePastedImages = useCallback(
    async (files: File[]) => {
      if (!editor || files.length === 0) return;
      for (const file of files) {
        try {
          const imageUrl = await uploadImageFile(file);
          editor.chain().focus().setImage({ src: imageUrl }).run();
        } catch {
          // Error is already handled in useRTEImageUpload
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
        showError('仅支持粘贴 PNG、JPEG、WEBP、AVIF 或 GIF 图片。');
        return;
      }

      void handlePastedImages(allowedImages);

      if (disallowedImages.length > 0) {
        showError('部分图片格式不受支持，仅处理了 PNG、JPEG、WEBP、AVIF 或 GIF 图片。');
      }
    },
    [editor, handlePastedImages, viewMode, showError]
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
      <LinkDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onSubmit={handleLinkSubmit}
        initialUrl={editor?.getAttributes('link').href}
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
