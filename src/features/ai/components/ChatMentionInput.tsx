'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from 'react';
import { Editor, Extension, Node } from '@tiptap/core';
import { closeHistory, history, redo, undo } from '@tiptap/pm/history';
import { keymap } from '@tiptap/pm/keymap';
import { Plugin } from '@tiptap/pm/state';

import { CHAT_MAX_QUESTION_LENGTH } from '@/lib/ai/chatMessages';
import { extractChatReferences } from '@/lib/ai/chatReferences';

import {
  chatInputContent,
  chatInputDocument,
  chatInputOffset,
  chatInputPosition,
  chatInputText,
  chatMentionToken,
} from './chatMentionDocument';

const Document = Node.create({ name: 'doc', topNode: true, content: 'paragraph' });
const Paragraph = Node.create({
  name: 'paragraph',
  content: 'inline*',
  parseHTML: () => [{ tag: 'p' }],
  renderHTML: () => ['p', 0],
});
const Text = Node.create({ name: 'text', group: 'inline' });
const HardBreak = Node.create({
  name: 'hardBreak',
  inline: true,
  group: 'inline',
  selectable: false,
  parseHTML: () => [{ tag: 'br' }],
  renderHTML: () => ['br'],
  renderText: () => '\n',
});
const Mention = Node.create({
  name: 'chatMention',
  inline: true,
  group: 'inline',
  atom: true,
  addAttributes: () => ({ label: { default: '角色' }, id: { default: '' } }),
  renderHTML: ({ node }) => [
    'span',
    { 'data-chat-mention': chatMentionToken(node) },
    chatMentionToken(node),
  ],
  renderText: ({ node }) => chatMentionToken(node),
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const token = chatMentionToken(node);
      const reference = extractChatReferences(token)[0]!.reference;
      const dom = document.createElement('span');
      dom.setAttribute('contenteditable', 'false');
      dom.dataset.chatMention = token;
      dom.title = `${reference.label} · ${reference.name}`;
      dom.className =
        'inline-flex max-w-full items-baseline gap-1 rounded-md bg-black/5 px-1.5 text-sm align-baseline dark:bg-white/10';
      const label = document.createElement('span');
      label.className = 'min-w-0 truncate';
      label.textContent = `@${reference.name}`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `移除引用 ${reference.id}`);
      remove.title = '移除引用';
      remove.className =
        'text-muted-foreground hover:text-foreground shrink-0 rounded px-0.5 focus-visible:outline-1';
      remove.textContent = '×';
      remove.addEventListener('mousedown', (event) => event.preventDefault());
      remove.addEventListener('keydown', (event) => event.stopPropagation());
      remove.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const position = getPos();
        if (typeof position === 'number') {
          editor.view.dispatch(
            closeHistory(editor.state.tr.delete(position, position + node.nodeSize))
          );
          editor.view.focus();
        }
      });
      dom.append(label, remove);
      return { dom, stopEvent: (event) => remove.contains(event.target as globalThis.Node) };
    };
  },
});

const Editing = Extension.create({
  name: 'chatEditing',
  priority: 1000,
  addProseMirrorPlugins() {
    return [
      history(),
      keymap({ 'Mod-z': undo, 'Shift-Mod-z': redo, 'Mod-y': redo }),
      new Plugin({
        filterTransaction: (transaction, state) =>
          !transaction.docChanged ||
          chatInputText(transaction.doc).length <= CHAT_MAX_QUESTION_LENGTH ||
          chatInputText(transaction.doc).length < chatInputText(state.doc).length,
      }),
    ];
  },
  addKeyboardShortcuts() {
    const removeAdjacent = (backward: boolean) => {
      const { selection } = this.editor.state;
      const node = backward ? selection.$from.nodeBefore : selection.$from.nodeAfter;
      if (!selection.empty || node?.type.name !== 'chatMention') return false;
      this.editor.view.dispatch(
        closeHistory(
          this.editor.state.tr.delete(
            backward ? selection.from - node.nodeSize : selection.from,
            backward ? selection.from : selection.from + node.nodeSize
          )
        )
      );
      return true;
    };
    return {
      // Submission and suggestion selection belong to the composer.
      Enter: () => true,
      'Shift-Enter': () => this.editor.commands.insertContent({ type: 'hardBreak' }),
      'Mod-a': () => this.editor.commands.selectAll(),
      Backspace: () => removeAdjacent(true),
      Delete: () => removeAdjacent(false),
    };
  },
});

export type ChatMentionInputHandle = {
  readonly selectionStart: number;
  readonly isFocused: boolean;
  focus: () => void;
  setSelectionRange: (start: number, end: number) => void;
  replaceValueAndFocus: (value: string, caret: number) => void;
};
type ChatMentionInputProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onKeyDown' | 'onCompositionStart' | 'onCompositionEnd' | 'onClick'
> & {
  value: string;
  onChange: (value: string, caret: number) => void;
  onCaretChange: (caret: number) => void;
  menuId: string | undefined;
  activeOptionId: string | undefined;
};

const ChatMentionInput = forwardRef<ChatMentionInputHandle, ChatMentionInputProps>(
  function ChatMentionInput(
    { value, onChange, onCaretChange, menuId, activeOptionId, ...events },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const callbacks = useRef({ onChange, onCaretChange });
    callbacks.current = { onChange, onCaretChange };
    const initialValue = useRef(value);
    useImperativeHandle(
      ref,
      () => ({
        get selectionStart() {
          const editor = editorRef.current;
          return editor ? chatInputOffset(editor.state.doc, editor.state.selection.from) : 0;
        },
        get isFocused() {
          return editorRef.current?.isFocused ?? false;
        },
        focus: () => editorRef.current?.view.focus(),
        setSelectionRange: (start, end) => {
          const editor = editorRef.current;
          if (editor)
            editor.commands.setTextSelection({
              from: chatInputPosition(editor.state.doc, start),
              to: chatInputPosition(editor.state.doc, end),
            });
        },
        replaceValueAndFocus: (text, caret) => {
          const editor = editorRef.current;
          if (!editor) return;
          editor.view.dispatch(closeHistory(editor.state.tr));
          editor.commands.setContent(chatInputDocument(text), { emitUpdate: false });
          editor.view.dispatch(closeHistory(editor.state.tr));
          editor.view.dom.dataset.empty = String(!text);
          editor.commands.setTextSelection(chatInputPosition(editor.state.doc, caret));
          editor.view.focus();
        },
      }),
      []
    );

    useEffect(() => {
      if (!mountRef.current) return;
      const editor = new Editor({
        element: mountRef.current,
        extensions: [Document, Paragraph, Text, HardBreak, Mention, Editing],
        content: chatInputDocument(initialValue.current),
        injectCSS: false,
        editorProps: {
          attributes: {
            id: 'ai-question',
            role: 'textbox',
            'aria-label': '你的问题',
            'aria-multiline': 'true',
            'aria-describedby': 'ai-composer-help',
            'aria-autocomplete': 'list',
            'aria-haspopup': 'listbox',
            'data-placeholder': '输入消息…',
            class:
              'chat-mention-input max-h-45 min-h-12 overflow-y-auto rounded-2xl px-3 py-2.5 text-base leading-6 wrap-anywhere whitespace-pre-wrap focus:outline-none',
          },
          clipboardTextSerializer: (slice) => chatInputText(slice.content),
          handlePaste: (view, event) => {
            event.preventDefault();
            const { from, to } = view.state.selection;
            const current = chatInputText(view.state.doc);
            const available =
              CHAT_MAX_QUESTION_LENGTH -
              current.length +
              chatInputOffset(view.state.doc, to) -
              chatInputOffset(view.state.doc, from);
            const text = (event.clipboardData?.getData('text/plain') ?? '')
              .replace(/\r\n?/g, '\n')
              .slice(0, Math.max(0, available));
            editor.view.dispatch(closeHistory(editor.state.tr));
            editor.commands.insertContentAt({ from, to }, chatInputContent(text));
            editor.view.dispatch(closeHistory(editor.state.tr));
            return true;
          },
          // External drops must not introduce HTML, images or client-provided reference data.
          handleDrop: (_view, event) => {
            event.preventDefault();
            return true;
          },
        },
        onUpdate: ({ editor: current }) => {
          const text = chatInputText(current.state.doc);
          current.view.dom.dataset.empty = String(!text);
          callbacks.current.onChange(
            text,
            chatInputOffset(current.state.doc, current.state.selection.from)
          );
        },
        onSelectionUpdate: ({ editor: current }) =>
          callbacks.current.onCaretChange(
            chatInputOffset(current.state.doc, current.state.selection.from)
          ),
      });
      editorRef.current = editor;
      editor.view.dom.dataset.empty = String(!initialValue.current);
      return () => {
        editorRef.current = null;
        editor.destroy();
      };
    }, []);

    useEffect(() => {
      const editor = editorRef.current;
      if (editor && chatInputText(editor.state.doc) !== value) {
        editor.view.dispatch(closeHistory(editor.state.tr));
        editor.commands.setContent(chatInputDocument(value), { emitUpdate: false });
        editor.view.dispatch(closeHistory(editor.state.tr));
        editor.view.dom.dataset.empty = String(!value);
      }
    }, [value]);

    useEffect(() => {
      const input = editorRef.current?.view.dom;
      if (!input) return;
      for (const [name, setting] of [
        ['aria-controls', menuId],
        ['aria-activedescendant', activeOptionId],
      ] as const) {
        if (setting) input.setAttribute(name, setting);
        else input.removeAttribute(name);
      }
    }, [menuId, activeOptionId]);

    return <div ref={mountRef} {...events} />;
  }
);

export default ChatMentionInput;
