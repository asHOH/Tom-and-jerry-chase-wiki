import { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';

import { ToolbarState } from '@/components/ui/RichTextEditor/Toolbar';

export function useRTEToolbarState(editor: Editor | null) {
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

  return toolbarState;
}
