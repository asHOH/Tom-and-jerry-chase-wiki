import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface RichTextEditorProps {
  content?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<p>Start editing...</p>',
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
