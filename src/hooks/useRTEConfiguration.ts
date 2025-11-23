import { useEffect } from 'react';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import clsx from 'clsx';

import { stripDisallowedImages } from '@/lib/richtext/imagePolicy';

interface UseRTEConfigurationProps {
  initialHtml: string;
  content: string;
  onChange?: ((content: string) => void) | undefined;
  className?: string | undefined;
}

export function useRTEConfiguration({
  initialHtml,
  content,
  onChange,
  className,
}: UseRTEConfigurationProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
    const current = stripDisallowedImages(editor.getHTML());
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: true });
    }
  }, [editor, content]);

  return editor;
}
