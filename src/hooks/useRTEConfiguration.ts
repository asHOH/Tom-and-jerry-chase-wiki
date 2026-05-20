import { useEffect } from 'react';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { cn } from '@/lib/design';
import {
  normalizeTextAlignAttributes,
  removeDisallowedClassAttributes,
  removeInlineStyleAttributes,
} from '@/lib/richtext/htmlTransforms';
import { stripDisallowedImages } from '@/lib/richtext/imagePolicy';
import { TextAlignClasses } from '@/lib/richtext/textAlignClasses';

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
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitized = removeDisallowedClassAttributes(
        removeInlineStyleAttributes(normalizeTextAlignAttributes(stripDisallowedImages(html)))
      );
      if (sanitized !== html) {
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
    const current = stripDisallowedImages(editor.getHTML());
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: true });
    }
  }, [editor, content]);

  return editor;
}
