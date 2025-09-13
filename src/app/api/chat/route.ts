import { GameDataManager } from '@/lib/dataManager';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the structure of a message part, including function calls and responses
// Based on Gemini's API structure
type Part = {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: {
      name: string;
      content: unknown;
    };
  };
};

// Define the structure of a message/content object
type Content = {
  role: 'user' | 'model';
  parts: Part[];
};

// Gemini safety settings - configured to the strictest level
const safetySettings = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
];

const systemInstructionText = `You are Chase, a helpful and knowledgeable assistant for the Tom and Jerry: Chase Wiki based on ${process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL}.
Your purpose is to provide accurate information about characters, skills, knowledge cards, and other game elements.
When a user asks for information about a specific character, use the 'getData' tool to retrieve the most up-to-date details.
Be friendly, concise, and focus on answering the user's question based on the data provided by the tool.
If the user asks about something outside of characters or game data, politely inform them that your expertise is limited to Tom and Jerry: Chase game information.

For requests that are harmful, unethical, inappropriate or outside of characters or game data, your only response MUST be: "I'm not able to assist with that." Do not apologize or provide any explanation.

# Tool Usage: getData

**1. Purpose:**
The getData tool is your primary source for all character-specific information in Tom and Jerry: Chase. It connects to the game's database to retrieve the latest, most accurate details.

**2. When to Use It:**
You **must** call this tool whenever a user's query is about a specific character. 

**3. How to Use It:**
The tool takes the character's Chinese name as an input. For example: getData(name="汤姆").

**4. Data Reliance:**
Your response **must be based exclusively** on the data returned by the getData tool. Do not add information from other sources or make assumptions. If the tool does not provide a specific piece of information the user asked for, you should state that the information is not available in your database.
`;

// System prompt to define the agent's persona and instructions
const systemInstruction = {
  role: 'model',
  parts: [
    {
      text: systemInstructionText,
    },
  ],
};

// Tool definition for fetching character data
const getDataTool = {
  functionDeclarations: [
    {
      name: 'getData',
      description:
        'Get data for a specific Tom and Jerry: Chase character, such as faction, skills, or description.',
      parameters: {
        type: 'OBJECT',
        properties: {
          name: {
            type: 'STRING',
            description: 'The name of the character to get data for.',
          },
        },
        required: ['name'],
      },
    },
  ],
};

/**
 * Placeholder for the actual tool implementation.
 * The user will replace this with the real data fetching logic.
 */
async function getData({ name }: { name: string }) {
  console.log(`Tool called: getData for "${name}"`);

  // const result = await getGotoResult(name);
  // if (!result) {
  //   return { error: `Character "${name}" not found.` };
  // }
  // return { result };
  const characters = Object.values(GameDataManager.getCharacters());
  const character =
    characters.find((c) => c.id === name) ?? characters.find((c) => c.aliases?.includes(name));
  if (!character) {
    return { error: `Character "${name}" not found.` };
  }
  return { character };
}

// Main POST handler for the chat API
export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Content[] } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL;

    if (!apiKey || !modelName) {
      return new NextResponse(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }), {
        status: 500,
      });
    }

    const getGeminiUrl = (streaming: boolean) =>
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:${streaming ? 'streamGenerateContent?alt=sse' : 'generateContent'}?key=${apiKey}`;

    const requestBody = {
      contents: messages,
      tools: [getDataTool],
      safetySettings,
      systemInstruction,
    };

    // 1. Make a non-streaming call to check for tool calls
    const initialResponse = await fetch(getGeminiUrl(false), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!initialResponse.ok) {
      const errorText = await initialResponse.text();
      return new NextResponse(
        JSON.stringify({ error: 'Gemini API call failed', details: errorText }),
        { status: initialResponse.status }
      );
    }

    const responseJson = await initialResponse.json();
    const candidate = responseJson.candidates?.[0];

    if (!candidate) {
      return new NextResponse(JSON.stringify({ error: 'No response candidate from Gemini' }), {
        status: 500,
      });
    }

    const functionCall = candidate.content?.parts?.find(
      (part: Part) => part.functionCall
    )?.functionCall;

    // 2. If Gemini requests a tool call
    if (candidate.finishReason === 'TOOL_CALL' && functionCall) {
      const { name, args } = functionCall;

      if (name === 'getData') {
        const toolResult = await getData(args);

        const newMessages: Content[] = [
          ...messages,
          { role: 'model', parts: [{ functionCall }] },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: 'getData',
                  response: { name: 'getData', content: toolResult },
                },
              },
            ],
          },
        ];

        const streamingRequestBody = {
          contents: newMessages,
          tools: [getDataTool],
          safetySettings,
          systemInstruction,
        };

        // 3. Make a second, STREAMING call with the tool result
        const streamResponse = await fetch(getGeminiUrl(true), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(streamingRequestBody),
        });

        if (!streamResponse.ok || !streamResponse.body) {
          const errorText = await streamResponse.text();
          return new NextResponse(
            JSON.stringify({ error: 'Failed to get streaming response', details: errorText }),
            { status: streamResponse.status }
          );
        }

        // 4. Stream the response back to the client
        return new NextResponse(streamResponse.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
      } else {
        return new NextResponse(JSON.stringify({ error: `Unsupported tool call: ${name}` }), {
          status: 400,
        });
      }
    }

    // 5. If no tool call, return the direct text response via a manual stream
    const text = candidate.content?.parts?.map((part: Part) => part.text).join('') || '';

    const stream = new ReadableStream({
      start(controller) {
        const chunk = {
          candidates: [
            {
              content: {
                parts: [{ text }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        };
        controller.enqueue(`data: ${JSON.stringify(chunk)}

`);
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ error: 'An internal server error occurred.', details: errorMessage }),
      { status: 500 }
    );
  }
}
