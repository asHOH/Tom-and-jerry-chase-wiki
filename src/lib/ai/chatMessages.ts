import type { UIMessage } from 'ai';
import { z } from 'zod';

export const CHAT_MAX_MESSAGES = 40;
export const CHAT_MAX_MESSAGE_BYTES = 64 * 1024;
export const CHAT_MAX_QUESTION_LENGTH = 4000;
// A verified window plus one new question; trim only after authentication.
export const CHAT_MAX_REQUEST_BYTES = CHAT_MAX_MESSAGE_BYTES + CHAT_MAX_QUESTION_LENGTH * 6 + 4096;

export const chatHistoryTokenSchema = z
  .string()
  .min(1)
  .max(2048)
  .regex(/^[\w-]+\.[\w-]+$/);
export const chatHistoryMetadataSchema = z.strictObject({
  history: z.strictObject({
    token: chatHistoryTokenSchema,
    messageIds: z.array(z.string().min(1).max(128)).min(2).max(CHAT_MAX_MESSAGES),
    truncated: z.boolean(),
  }),
});

export const chatTextMessageSchema = z.strictObject({
  id: z.string().min(1).max(128),
  role: z.enum(['user', 'assistant']),
  parts: z.array(z.strictObject({ type: z.literal('text'), text: z.string().min(1) })).length(1),
});

export type ChatTextMessage = z.infer<typeof chatTextMessageSchema>;

export const serializedMessageBytes = (messages: readonly ChatTextMessage[]) =>
  new TextEncoder().encode(JSON.stringify(messages)).byteLength;

export const chatRequestSchema = z
  .strictObject({
    messages: z
      .array(chatTextMessageSchema)
      .min(1)
      .max(CHAT_MAX_MESSAGES + 1),
    historyToken: chatHistoryTokenSchema.optional(),
  })
  .superRefine(({ messages }, context) => {
    const question = messages.at(-1);
    if (
      question?.role !== 'user' ||
      !question.parts[0]?.text.trim() ||
      question.parts[0].text.length > CHAT_MAX_QUESTION_LENGTH ||
      messages[0]?.role !== 'user' ||
      serializedMessageBytes(messages.slice(0, -1)) > CHAT_MAX_MESSAGE_BYTES ||
      new Set(messages.map((message) => message.id)).size !== messages.length ||
      messages.some((message, index) => message.role !== (index % 2 === 0 ? 'user' : 'assistant'))
    ) {
      context.addIssue({ code: 'custom', message: 'Invalid conversation context' });
    }
  });

/** Keep only visible text. Tool results and reasoning never enter saved or outgoing history. */
export function toChatTextMessages(messages: readonly UIMessage[]): ChatTextMessage[] {
  return messages.flatMap((message) => {
    if (message.role !== 'user' && message.role !== 'assistant') return [];
    const text = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('');
    return text
      ? [{ id: message.id, role: message.role, parts: [{ type: 'text' as const, text }] }]
      : [];
  });
}

/** Unsigned/partial turns stay visible locally, but never become historical model input. */
export function prepareChatRequest(messages: readonly UIMessage[]) {
  const question = messages.at(-1);
  const textQuestion = question && toChatTextMessages([question])[0];
  if (!textQuestion || textQuestion.role !== 'user') throw new Error('请先输入问题。');

  for (let index = messages.length - 2; index >= 0; index--) {
    const message = messages[index]!;
    const metadata = chatHistoryMetadataSchema.safeParse(message.metadata);
    if (message.role !== 'assistant' || !metadata.success) continue;
    const { token, messageIds, truncated } = metadata.data.history;
    const byId = new Map(
      toChatTextMessages(messages.slice(0, index + 1)).map((entry) => [entry.id, entry])
    );
    const history = messageIds.map((id) => {
      const entry = byId.get(id);
      if (!entry) throw new Error('对话记录不完整，请清空对话后重试。');
      return entry;
    });
    if (messageIds.at(-1) !== message.id) throw new Error('对话记录不完整，请清空对话后重试。');
    return {
      body: { messages: [...history, textQuestion], historyToken: token },
      truncated,
      skippedUnsigned: index < messages.length - 2,
    };
  }
  return {
    body: { messages: [textQuestion] },
    truncated: false,
    skippedUnsigned: messages.length > 1,
  };
}

/** Drop whole oldest turns, never splitting off a question from its answers. */
export function fitChatContext(messages: readonly UIMessage[]) {
  const textMessages = toChatTextMessages(messages);
  let start = Math.max(
    0,
    textMessages.findIndex((message) => message.role === 'user')
  );
  while (
    textMessages.length - start > CHAT_MAX_MESSAGES ||
    serializedMessageBytes(textMessages.slice(start)) > CHAT_MAX_MESSAGE_BYTES
  ) {
    const nextUser = textMessages.findIndex(
      (message, index) => index > start && message.role === 'user'
    );
    if (nextUser === -1) throw new Error('问题过长，请缩短后重试。');
    start = nextUser;
  }
  return { messages: textMessages.slice(start), truncated: start > 0 };
}
