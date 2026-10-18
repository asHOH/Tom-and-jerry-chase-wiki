import type { UIMessage } from 'ai';
import { z } from 'zod';

import { storage, StorageKey } from '@/lib/localStorage';

import {
  chatHistoryMetadataSchema,
  chatTextMessageSchema,
  toChatTextMessages,
} from './chatMessages';

const historySchema = z.strictObject({
  version: z.union([z.literal(1), z.literal(2)]),
  messages: z.array(
    chatTextMessageSchema.extend({ metadata: chatHistoryMetadataSchema.optional() })
  ),
});

export const getChatHistoryKey = (userId: string) => `${StorageKey.AiConversationPrefix}${userId}`;

export function loadChatHistory(userId: string): { messages: UIMessage[]; notice: string | null } {
  const saved = storage.getItem(getChatHistoryKey(userId));
  if (saved === null) return { messages: [], notice: null };
  const parsed = historySchema.safeParse(storage.parseJson(saved));
  if (!parsed.success) {
    storage.removeItem(getChatHistoryKey(userId));
    return { messages: [], notice: '本地对话记录已损坏，已开始新的对话。' };
  }
  return {
    messages: parsed.data.messages,
    notice:
      parsed.data.version === 1 && parsed.data.messages.length
        ? '旧对话仍可查看，后续提问将开始新的上下文。'
        : null,
  };
}

export function saveChatHistory(userId: string, messages: readonly UIMessage[]): boolean {
  return storage.setJson(getChatHistoryKey(userId), {
    version: 2,
    messages: messages.flatMap((message) => {
      const textMessages = toChatTextMessages([message]);
      const metadata = chatHistoryMetadataSchema.safeParse(message.metadata);
      return textMessages.map((textMessage) => ({
        ...textMessage,
        ...(message.role === 'assistant' && metadata.success ? { metadata: metadata.data } : {}),
      }));
    }),
  });
}
