import { Extension } from '@tiptap/core';

const ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const;
type TextAlignment = (typeof ALIGNMENTS)[number];

const ALIGN_CLASS_PREFIX = 'rte-text-';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textAlignClasses: {
      setTextAlign: (alignment: TextAlignment) => ReturnType;
      unsetTextAlign: () => ReturnType;
      toggleTextAlign: (alignment: TextAlignment) => ReturnType;
    };
  }
}

function parseAlignment(element: HTMLElement): TextAlignment | null {
  const classAlignment = ALIGNMENTS.find((alignment) =>
    element.classList.contains(`${ALIGN_CLASS_PREFIX}${alignment}`)
  );
  if (classAlignment) return classAlignment;

  const styleAlignment = element.style.textAlign;
  return ALIGNMENTS.find((alignment) => alignment === styleAlignment) ?? null;
}

export const TextAlignClasses = Extension.create({
  name: 'textAlignClasses',

  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: parseAlignment,
            renderHTML: (attributes) => {
              if (!attributes.textAlign) {
                return {};
              }

              return { class: `${ALIGN_CLASS_PREFIX}${String(attributes.textAlign)}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextAlign:
        (alignment: TextAlignment) =>
        ({ commands }) => {
          if (!ALIGNMENTS.includes(alignment)) {
            return false;
          }

          return ['heading', 'paragraph']
            .map((type) => commands.updateAttributes(type, { textAlign: alignment }))
            .some(Boolean);
        },

      unsetTextAlign:
        () =>
        ({ commands }) => {
          return ['heading', 'paragraph']
            .map((type) => commands.resetAttributes(type, 'textAlign'))
            .some(Boolean);
        },

      toggleTextAlign:
        (alignment: TextAlignment) =>
        ({ editor, commands }) => {
          if (!ALIGNMENTS.includes(alignment)) {
            return false;
          }

          if (editor.isActive({ textAlign: alignment })) {
            return commands.unsetTextAlign();
          }

          return commands.setTextAlign(alignment);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-l': () => this.editor.commands.setTextAlign('left'),
      'Mod-Shift-e': () => this.editor.commands.setTextAlign('center'),
      'Mod-Shift-r': () => this.editor.commands.setTextAlign('right'),
      'Mod-Shift-j': () => this.editor.commands.setTextAlign('justify'),
    };
  },
});
