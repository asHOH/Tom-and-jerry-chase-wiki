import type { JSONContent } from '@tiptap/core';
import type { Fragment, Node } from '@tiptap/pm/model';

import {
  extractChatReferences,
  referenceToken,
  type ChatReferenceLabel,
} from '@/lib/ai/chatReferences';

export const chatMentionToken = (node: Node): string =>
  referenceToken({ label: node.attrs.label as ChatReferenceLabel, id: String(node.attrs.id) });

export function chatInputContent(text: string): JSONContent[] {
  const content: JSONContent[] = [];
  const appendText = (value: string) => {
    value.split('\n').forEach((line, index) => {
      if (index) content.push({ type: 'hardBreak' });
      if (line) content.push({ type: 'text', text: line });
    });
  };
  let end = 0;
  for (const match of extractChatReferences(text)) {
    appendText(text.slice(end, match.start));
    content.push({
      type: 'chatMention',
      attrs: { label: match.reference.label, id: match.reference.id },
    });
    end = match.end;
  }
  appendText(text.slice(end));
  return content;
}

export const chatInputDocument = (text: string): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: chatInputContent(text) }],
});

function nodeText(node: Node): string {
  if (node.isText) return node.text ?? '';
  if (node.type.name === 'hardBreak') return '\n';
  if (node.type.name === 'chatMention') return chatMentionToken(node);
  return '';
}

export function chatInputText(doc: Node | Fragment): string {
  let text = '';
  doc.descendants((node) => {
    text += nodeText(node);
  });
  return text;
}

/** Map between canonical string offsets and the editor's atomic reference nodes. */
export function chatInputOffset(doc: Node, position: number): number {
  let offset = 0;
  doc.descendants((node, from) => {
    const text = nodeText(node);
    if (from >= position || !text) return;
    offset += node.isText ? Math.min(position - from, text.length) : text.length;
  });
  return offset;
}

export function chatInputPosition(doc: Node, offset: number): number {
  let consumed = 0;
  let position = 1;
  doc.descendants((node, from) => {
    const text = nodeText(node);
    if (!text || consumed > offset) return;
    if (consumed + text.length <= offset) position = from + node.nodeSize;
    else position = node.isText ? from + offset - consumed : from;
    consumed += text.length;
  });
  return Math.min(position, doc.content.size - 1);
}
