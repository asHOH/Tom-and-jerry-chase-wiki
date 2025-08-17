import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const RichTextEditor: React.FC = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start editing...</p>',
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
