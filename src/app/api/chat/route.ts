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

const characters = Object.values(GameDataManager.getCharacters());

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
If the user's prompt consists of only a character's name, use the getData tool to retrieve information and provide a brief introduction of that character.
You MUST respond in simplified Chinese in plain text without any markdown formatting, HTML tags, or special characters. 

For requests that are harmful, unethical, inappropriate or outside of characters or game data, your only response MUST be: "I'm not able to assist with that." Do not apologize or provide any explanation.

# Tool Usage: getData

**1. Purpose:**
The getData tool is your primary source for all character-specific information in Tom and Jerry: Chase. It connects to the game's database to retrieve the latest, most accurate details.

**2. When to Use It:**
You **must** call this tool whenever a user's query is about a specific character. You have the access to the following characters: ${JSON.stringify(characters.map(({ id, aliases }) => ({ id, aliases })))}. 

**3. How to Use It:**
The tool takes the character's Chinese name as an input. For example: getData(name="汤姆"). The name MUST match exactly with the character's name or one of their aliases. 

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
    console.log('Received messages:', JSON.stringify(messages, null, 2));

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL;

    if (!apiKey || !modelName) {
      return new NextResponse(JSON.stringify({ error: 'GEMINI_API_KEY is not set' }), {
        status: 500,
      });
    }

    const getGeminiUrl = () =>
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const currentMessages: Content[] = [...messages];
    const MAX_TOOL_CALLS = 5; // Safety break to prevent infinite loops

    for (let i = 0; i < MAX_TOOL_CALLS; i++) {
      const requestBody = {
        contents: currentMessages,
        tools: [getDataTool],
        safetySettings,
        systemInstruction,
      };

      console.log(`Loop ${i + 1} - Request body:`, JSON.stringify(requestBody, null, 2));

      const response = await fetch(getGeminiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API call failed in loop ${i + 1}:`, errorText);
        return new NextResponse(
          JSON.stringify({ error: 'Gemini API call failed', details: errorText }),
          { status: response.status }
        );
      }

      const responseJson = await response.json();
      console.log(`Loop ${i + 1} - API response:`, JSON.stringify(responseJson, null, 2));

      const candidate = responseJson.candidates?.[0];

      if (!candidate) {
        console.error('No candidate in response:', responseJson);
        return new NextResponse(JSON.stringify({ error: 'No response candidate from Gemini' }), {
          status: 500,
        });
      }

      const functionCallPart = candidate.content?.parts?.find((part: Part) => part.functionCall);

      if (functionCallPart?.functionCall) {
        console.log('Function call detected:', functionCallPart.functionCall);
        const { name, args } = functionCallPart.functionCall;

        if (name === 'getData') {
          const toolResult = await getData(args as { name: string });
          console.log('Tool result:', toolResult);

          // Append the model's function call and the tool's response to the history
          currentMessages.push(
            { role: 'model', parts: [functionCallPart] },
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
            }
          );
          // Continue the loop to send the tool result back to the model
        } else {
          console.error('Unsupported tool call:', name);
          return new NextResponse(JSON.stringify({ error: `Unsupported tool call: ${name}` }), {
            status: 400,
          });
        }
      } else {
        // No function call, so it must be a text response. We're done.
        const text = candidate.content?.parts?.map((part: Part) => part.text).join('') || '';
        console.log('Final text response:', text);

        return new NextResponse(
          JSON.stringify({
            text,
            candidates: responseJson.candidates,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // If the loop finishes, it means the maximum number of tool calls was reached.
    console.error('Maximum number of tool calls reached.');
    return new NextResponse(
      JSON.stringify({ error: 'Maximum number of tool calls reached. Please try again.' }),
      { status: 500 }
    );
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ error: 'An internal server error occurred.', details: errorMessage }),
      { status: 500 }
    );
  }
}
