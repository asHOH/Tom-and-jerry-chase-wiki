import { useEffect } from 'react';
import { createDocument } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { cn } from '@/lib/design';
import { normalizeEditorHtml } from '@/lib/richtext/htmlTransforms';
import { TextAlignClasses } from '@/lib/richtext/textAlignClasses';

interface UseRTEConfigurationProps {
  initialHtml: string;
  content: string;
  onChange?: ((content: string) => void) | undefined;
  className?: string | undefined;
  preset?: 'full' | 'notice';
}

export function useRTEConfiguration({
  initialHtml,
  content,
  onChange,
  className,
  preset = 'full',
}: UseRTEConfigurationProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      TextAlignClasses,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: normalizeEditorHtml(initialHtml, preset),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = normalizeEditorHtml(html, preset);
      // Compare parsed nodes because Tiptap restores defaults such as link target and rel.
      if (sanitized !== html && !editor.state.doc.eq(createDocument(sanitized, editor.schema))) {
        editor.commands.setContent(sanitized, { emitUpdate: false });
      }
      onChange?.(sanitized);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none',
          'dark:prose-invert',
          'focus:outline-none',
          'p-6 min-h-100',
          'text-gray-900 dark:text-gray-100',
          className
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const target = normalizeEditorHtml(content, preset);
    if (!editor.state.doc.eq(createDocument(target, editor.schema))) {
      editor.commands.setContent(target, { emitUpdate: true });
    }
  }, [editor, content, preset]);

  return editor;
}
