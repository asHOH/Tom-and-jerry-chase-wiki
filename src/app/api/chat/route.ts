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

const systemInstructionText = `You are Chase, a helpful and knowledgeable assistant for the Tom and Jerry: Chase Wiki (猫和老鼠手游百科) based on ${process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL}.
Your purpose is to provide accurate information about characters, skills, knowledge cards, and other game elements.
When a user asks for information about a specific character, use the 'getData' tool to retrieve the most up-to-date details.
Be friendly, concise, and focus on answering the user's question based on the data provided by the tool.
If the user asks about something outside of characters or game data, politely inform them that your expertise is limited to Tom and Jerry: Chase game information.
If the user's prompt consists of only a character's name, use the getData tool to retrieve information and provide a brief introduction of that character.
You MUST respond in simplified Chinese in plain text without any markdown formatting, HTML tags, or special characters. 

For requests that are harmful, unethical, inappropriate, your only response MUST be: "I'm not able to assist with that." Do not apologize or provide any explanation.

# Tool Usage: getData

**1. Purpose:**
The getData tool is your primary source for all character-specific information in Tom and Jerry: Chase. It connects to the game's database to retrieve the latest, most accurate details.

**2. When to Use It:**
You **must** call this tool whenever a user's query is about a specific character. You have the access to the following characters: ${JSON.stringify(characters.map(({ id, aliases }) => ({ id, aliases })))}. 

**3. How to Use It:**
The tool takes the character's Chinese name as an input. For example: getData(name="汤姆"). The name MUST match exactly with the character's name or one of their aliases. 

**4. Data Reliance:**
Your response **must be based exclusively** on the data returned by the getData tool. Do not add information from other sources or make assumptions. If the tool does not provide a specific piece of information the user asked for, you should state that the information is not available in your database.

**5. Return Type:**
The tool's return type is a JSON object \` { character: CharacterDefinition } \`.  Below are the detailed TypeScript type definitions for \`CharacterDefinition\`, with each field's meaning explained via comments.

\`\`\`typescript
// The unique identifier for a character's faction.
type FactionId = 'cat' | 'mouse';

// --- Positioning Tags ---
// These tags categorize a character's primary role or playstyle.

// Defines the possible positioning tags specifically for Cat characters.
type CatPositioningTagName = '进攻' | '防守' | '追击' | '打架' | '速通' | '翻盘' | '后期';
// Defines the possible positioning tags specifically for Mouse characters.
type MousePositioningTagName = '奶酪' | '干扰' | '辅助' | '救援' | '破局' | '砸墙' | '后期';

// Describes a specific positioning tag applied to a Cat character.
type CatPositioningTag = {
  tagName: CatPositioningTagName; // The name of the tag from the predefined list.
  weapon?: 1 | 2; // Associates the tag with weapon 1 or weapon 2, if applicable.
  isMinor: boolean; // True if this is a secondary or less prominent role for the character.
  description: string; // A brief explanation of why the character fits this positioning.
  additionalDescription: string; // An extended description for a more detailed view.
};

// Describes a specific positioning tag applied to a Mouse character.
type MousePositioningTag = {
  tagName: MousePositioningTagName; // The name of the tag from the predefined list.
  weapon?: 1 | 2; // Associates the tag with weapon 1 or weapon 2, if applicable.
  isMinor: boolean; // True if this is a secondary or less prominent role for the character.
  description: string; // A brief explanation of why the character fits this positioning.
  additionalDescription: string; // An extended description for a more detailed view.
};

// --- Skills and Abilities ---

// Defines a recommended skill upgrade order.
type SkillAllocation = {
  id: string; // A unique name for this allocation build (e.g., "Aggressive Build").
  pattern: string; // The upgrade sequence, e.g., "021112200". 0: passive, 1: active, 2: weapon1, 3: weapon2.
  weaponType: 'weapon1' | 'weapon2'; // Specifies which primary weapon this build focuses on.
  description: string; // A brief explanation of this skill build's strategy.
  additionaldescription?: string; // Optional extra details about the build.
};

// The category of a skill.
type SkillType = 'active' | 'weapon1' | 'weapon2' | 'passive';

// The specific in-game actions that can interrupt a skill's animation.
type CancellableKeyType =
  | '道具键' // Item key
  | '道具键*' // Item key (only when the character has an item)
  | '跳跃键' // Jump key
  | '移动键' // Movement key
  | '药水键' // Potion key
  | '本技能键' // The skill's own key
  | '其他技能键'; // Another skill's key

// Defines how a skill's startup animation (cast time) can be cancelled.
type CancelableSkillType = CancellableKeyType[] | '无前摇' | '不可主动打断'; // Can be a list of keys, 'No startup animation', or 'Cannot be actively cancelled'.
// Defines how a skill's recovery animation (aftercast) can be cancelled.
type CancelableAftercastType = CancellableKeyType[] | '无后摇' | '不可取消'; // Can be a list of keys, 'No recovery animation', or 'Cannot be cancelled'.

// Describes a single level of a skill.
type SkillLevel = {
  level: number; // The level of the skill (e.g., 1, 2, 3).
  description: string; // A description of the effects at this level.
  detailedDescription?: string; // An optional, more detailed description.
  cooldown?: number; // The skill's cooldown time in seconds at this level.
};

// The complete definition of a character's skill.
type SkillDefinition = {
  name: string; // The name of the skill.
  type: SkillType; // The type of skill (active, weapon, passive).
  aliases?: string[]; // Alternative names for the skill, used for searching.
  description?: string; // A general description of the skill's function.
  detailedDescription?: string; // A more detailed description.
  videoUrl?: string; // URL for a video demonstrating the skill.

  // --- Skill Usage Properties ---
  canMoveWhileUsing?: boolean; // True if the character can move while casting the skill.
  canUseInAir?: boolean; // True if the skill can be used mid-air.
  cancelableSkill?: CancelableSkillType; // How the startup animation can be cancelled.
  cancelableAftercast?: CancelableAftercastType; // How the recovery animation can be cancelled.
  forecast?: number; // The startup animation time in seconds (cast time).
  aftercast?: number; // The recovery animation time in seconds (aftercast).
  canHitInPipe?: boolean; // True if the skill can affect characters inside pipes.
  cooldownTiming?: '前摇前' | '释放时' | '释放后'; // When the cooldown begins: 'Before cast', 'During cast', or 'After cast'.
  cueRange?: '全图可见' | '本房间可见' | '无音效'; // The audible range of the skill's sound effect: 'Map-wide', 'Room-only', or 'No sound'.

  skillLevels: SkillLevel[]; // An array detailing each level of the skill.
};

// --- Knowledge Cards (Perks) ---

// A recommended set of knowledge cards.
type KnowledgeCardGroup = {
  cards: string[]; // A list of knowledge card names in this set, each item in the format of \`\${rank}-\${name}\`.
  description?: string; // A brief description of the strategy for this card set.
  contributor?: string; // The user or community member who suggested this set.
};

// A collection of KnowledgeCardGroup, often for a specific playstyle.
type KnowledgeCardGroupSet = {
  id: string; // The name for this collection of card groups.
  description: string; // A description for the overall set.
  detailedDescription?: string; // Optional detailed description.
  groups: KnowledgeCardGroup[]; // The list of card groups within this set.
  defaultFolded: boolean; // UI hint: whether this set should be collapsed by default.
};

// --- Other Character Details ---

// A suggested special skill for the character.
type SuggestedSpecialSkillItem = {
  name: string; // The name of the special skill.
  description: string; // A description of why this skill is recommended.
};

// Describes the relationship (e.g., counter, synergy) with another character.
type CharacterRelationItem = {
  id: string; // The ID of the other character.
  description?: string; // An explanation of the relationship.
  isMinor: boolean; // True if the relationship is situational or less significant.
};

// The main data structure for a single character.
type CharacterDefinition = {
  description: string; // The character's in-game biography or description.
  aliases?: string[]; // Alternative names for the character, used for searching.

  // --- Base Character Attributes ---
  maxHp?: number; // Maximum health points.
  attackBoost?: number; // Bonus attack damage percentage.
  hpRecovery?: number; // Health recovery rate.
  moveSpeed?: number; // Base movement speed.
  jumpHeight?: number; // Base jump height.

  // --- Cat-Specific Attributes ---
  clawKnifeCdHit?: number; // Cooldown of the basic claw attack on a successful hit.
  clawKnifeCdUnhit?: number; // Cooldown of the basic claw attack on a miss.
  clawKnifeRange?: number; // The range of the basic claw attack.
  initialItem?: string; // The item the cat starts the match with, "老鼠夹" if unspecified.

  // --- Mouse-Specific Attributes ---
  cheesePushSpeed?: number; // The character's speed when pushing cheese (the speed in within 3 minutes after the beginning of a game).
  wallCrackDamageBoost?: number; // Bonus damage dealt to the final wall crack.

  // --- Character Build and Strategy Information ---
  catPositioningTags?: CatPositioningTag[]; // List of positioning tags if the character is a cat.
  mousePositioningTags?: MousePositioningTag[]; // List of positioning tags if the character is a mouse.
  skillAllocations?: SkillAllocation[]; // Recommended skill upgrade paths.
  skills: SkillDefinition[]; // A list of the character's skills.
  knowledgeCardGroups: (KnowledgeCardGroup | KnowledgeCardGroupSet)[]; // Recommended knowledge card setups.
  specialSkills?: SuggestedSpecialSkillItem[]; // Recommended special skills.

  // --- Matchup Information ---
  counters?: CharacterRelationItem[]; // Characters this character is strong against.
  countersKnowledgeCards?: CharacterRelationItem[]; // Matchups where specific knowledge cards give an advantage.
  countersSpecialSkills?: CharacterRelationItem[]; // Matchups where specific special skills give an advantage.

  counteredBy?: CharacterRelationItem[]; // Characters this character is weak against.
  counteredByKnowledgeCards?: CharacterRelationItem[]; // Matchups where the opponent's knowledge cards are a disadvantage.
  counteredBySpecialSkills?: CharacterRelationItem[]; // Matchups where the opponent's special skills are a disadvantage.

  counteredEachOther?: CharacterRelationItem[]; // Charaters this character has different relation with (in different time periods within the game),or both parties have low fault tolerance rates.

  collaborators?: CharacterRelationItem[]; // Characters this character has good synergy with.
};
\`\`\`
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
        signal: req.signal,
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
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request was aborted by the client.');
      // Return an empty response to signify abortion
      return new NextResponse('', { status: 204 });
    }
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(
      JSON.stringify({ error: 'An internal server error occurred.', details: errorMessage }),
      { status: 500 }
    );
  }
}
