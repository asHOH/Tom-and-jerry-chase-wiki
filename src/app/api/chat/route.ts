import { NextResponse, type NextRequest } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai';
import { z } from 'zod';

import { CHAT_CODE_MAX_LENGTH, executeChatCode } from '@/lib/ai/chatCodeExecution';
import { selectChatGameData } from '@/lib/gameData/chatGameData';
import { getPublishedGameDataSnapshot } from '@/lib/gameData/published/publishedSnapshot';
import { checkRateLimit } from '@/lib/rateLimit';
import { historyData } from '@/data/history';
import { actorProfileLookup } from '@/features/actor-profiles/serialization';
import itemGroups from '@/features/items/data/itemGroups';
import { env } from '@/env';

export const runtime = 'nodejs';

const CHAT_REQUEST_MAX_CHARACTERS = 8 * 1024;
const CHAT_MAX_OUTPUT_TOKENS = 2048;

const debugLoggingEnabled = env.CHAT_DEBUG_LOG === '1';
const logDebug = (message: string, detail?: unknown) => {
  if (!debugLoggingEnabled) return;
  if (detail === undefined) {
    console.log(message);
  } else {
    console.log(message, detail);
  }
};

const SYSTEM_INSTRUCTION = `You are Chase, the assistant for the unofficial Tom and Jerry: Chase Wiki (猫和老鼠手游百科).
Answer only questions about the game. For unrelated questions, briefly say your expertise is limited to the game.
Respond in concise simplified Chinese plain text. Do not use Markdown or HTML.
For harmful, unethical, or inappropriate requests, respond only: "我无法提供帮助。"

Use executeCode for every answer that needs game facts, including a prompt containing only a character name. Base factual claims exclusively on its result; say when the database lacks the requested information.
Available objects: characters, actorProfiles, cards, specialSkills.cat, specialSkills.mouse, items, entities.cat, entities.mouse, buffs, itemGroups, historyData.
Objects are generally keyed by Chinese name and may contain an aliases array. When direct lookup fails, search keys and aliases.
Return only the fields and records needed to answer the question; never return an entire collection when a filtered or mapped result is sufficient.
Examples:
- return characters["汤姆"]
- return Object.entries(cards).find(([name, value]) => name === "乘胜追击" || value.aliases?.includes("乘胜追击"))?.[1]
- return historyData.find(year => year.year === 2020)?.events
- return Object.values(actorProfiles).map(({name, maxHp}) => ({name, maxHp})).sort((a, b) => a.maxHp - b.maxHp)
Keep the final answer brief unless the user explicitly requests detail.`;

const requestSchema = z
  .object({
    messages: z.array(z.unknown()).min(1).max(4),
  })
  .superRefine(({ messages }, context) => {
    if (JSON.stringify(messages).length > CHAT_REQUEST_MAX_CHARACTERS) {
      context.addIssue({
        code: 'custom',
        message: 'Messages are too large',
        path: ['messages'],
      });
    }
  });

// Main POST handler - streams the AI response including tool calls to the client
export async function POST(req: NextRequest) {
  try {
    if (req.signal.aborted) {
      return new NextResponse(null, { status: 204 });
    }

    const rl = await checkRateLimit(req, 'expensive', 'chat');
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: rl.headers as HeadersInit,
        }
      );
    }

    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.issues },
        { status: 400 }
      );
    }
    const messages = parsed.data.messages;
    logDebug('Received messages count:', messages.length);

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 500 });
    }

    const openai = createOpenAI({
      apiKey,
      ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
    });

    const snapshot = await getPublishedGameDataSnapshot();
    if (req.signal.aborted) {
      return new NextResponse(null, { status: 204 });
    }

    const chatGameData = selectChatGameData(snapshot.data);
    const executionContext = {
      ...chatGameData,
      actorProfiles: actorProfileLookup,
      itemGroups,
      historyData,
    };
    const executeCode = tool({
      description:
        'Query the Tom and Jerry: Chase database with synchronous JavaScript. Return only data needed for the answer.',
      inputSchema: z.object({
        code: z
          .string()
          .max(CHAT_CODE_MAX_LENGTH)
          .describe(
            'JavaScript with a return statement. Available variables: characters, actorProfiles, cards, specialSkills, items, entities, buffs, itemGroups, historyData.'
          ),
      }),
      execute: ({ code }, { abortSignal }) => {
        if (abortSignal?.aborted) {
          throw abortSignal.reason ?? new DOMException('Chat request aborted', 'AbortError');
        }
        return executeChatCode(code, executionContext);
      },
    });

    const result = streamText({
      model: openai(env.NEXT_PUBLIC_AI_CHAT_MODEL || 'gpt-5.5'),
      system: SYSTEM_INSTRUCTION,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: {
        executeCode,
      },
      maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
      stopWhen: stepCountIs(3),
      abortSignal: req.signal,
      onAbort: () => {
        logDebug('Upstream chat generation was aborted.');
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logDebug('Request was aborted by the client.');
      return new NextResponse(null, { status: 204 });
    }
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'An internal server error occurred.', details: errorMessage },
      { status: 500 }
    );
  }
}
