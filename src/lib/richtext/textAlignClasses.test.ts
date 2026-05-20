import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { TextAlignClasses } from './textAlignClasses';

function createEditor(content: string) {
  return new Editor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      TextAlignClasses,
    ],
    content,
  });
}

describe('TextAlignClasses', () => {
  it('serializes text alignment commands as classes', () => {
    const editor = createEditor('<p>Body</p>');

    editor.commands.setTextAlign('center');

    expect(editor.getHTML()).toBe('<p class="rte-text-center">Body</p>');
    editor.destroy();
  });

  it('parses legacy text-align styles into alignment classes', () => {
    const editor = createEditor('<h2 style="text-align: right;">Title</h2>');

    expect(editor.getHTML()).toBe('<h2 class="rte-text-right">Title</h2>');
    editor.destroy();
  });
});
