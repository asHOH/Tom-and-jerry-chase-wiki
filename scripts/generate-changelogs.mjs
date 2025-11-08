/**
 * Generate changelogs from git commits using Gemini AI
 *
 * This script:
 * 1. Reads git commits from the past 7 days
 * 2. Uses Gemini AI to convert them to structured changelog entries
 * 3. Groups changes by date (YYYY-MM-DD)
 * 4. Outputs to src/data/generated/changeLogs.json
 *
 * Usage:
 *   npm run generate:changelogs
 *
 * Environment Variables (from .env or .env.example):
 *   - GEMINI_API_KEY: Your Gemini API key (required)
 *   - NEXT_PUBLIC_GEMINI_CHAT_MODEL: Model to use (default: gemini-2.5-flash)
 *
 * Output Format:
 *   - JSON array of daily changelogs
 *   - Each day contains changes grouped by commit type
 *   - TypeScript types available in src/data/generated/changeLogs.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Do NOT change the path
// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY not found in environment');
  process.exit(1);
}

// TypeScript type definitions for the output
const TYPE_DEFINITIONS = `
/**
 * Type of change made in a commit
 */
export type ChangeType = 
  | 'feat'      // New feature
  | 'fix'       // Bug fix
  | 'docs'      // Documentation changes
  | 'style'     // Code style changes (formatting, etc.)
  | 'refactor'  // Code refactoring
  | 'perf'      // Performance improvements
  | 'test'      // Test additions or modifications
  | 'chore'     // Build process or auxiliary tool changes
  | 'revert'    // Revert previous commit
  | 'other';    // Other changes

/**
 * Represents a single change entry
 */
export interface ChangeEntry {
  type: ChangeType;
  scope?: string;           // The scope of the change (e.g., 'ai', 'ui', 'data')
  message: string;          // Brief description of the change
  breaking?: boolean;       // Whether this is a breaking change
  hash: string;             // Git commit hash (short)
  author?: string;          // Commit author
}

/**
 * Changelogs grouped by date
 */
export interface DailyChangelog {
  date: string;             // ISO date string (YYYY-MM-DD)
  changes: ChangeEntry[];   // List of changes for this day
}

/**
 * Root type for the changelog data
 */
export type ChangeLogs = DailyChangelog[];
`.trim();

// Prompt for the AI to convert git logs to changelog format
const SYSTEM_PROMPT = `You are a changelog generator. Convert git commit logs into structured changelog entries.

**Output Format:**
You MUST respond with ONLY a valid JSON array, no additional text, markdown formatting, or code blocks.
The JSON should be an array of DailyChangelog objects with this exact TypeScript structure:

${TYPE_DEFINITIONS}

**Conversion Rules:**
1. Group commits by date (YYYY-MM-DD format)
2. Extract the type from conventional commit format (feat, fix, docs, etc.)
3. Extract the scope from parentheses if present
4. Use the commit message as the change description
5. Mark breaking changes if the commit has "BREAKING CHANGE" or "!" in the type
6. Include the short git hash (first 7 characters)
7. Sort dates in descending order (newest first)
8. Within each day, sort by type priority: feat > fix > perf > refactor > docs > style > test > chore > other
9. If a commit doesn't follow conventional format, classify it as 'other'
10. Keep descriptions concise and user-friendly

**Example Input:**
a468007|2025-11-08 16:02:55 +0800|fix(ai): fix the issue of tool call timeout
c64f41b|2025-11-08 11:35:18 +0800|feat(ai): add history support

**Example Output:**
[
  {
    "date": "2025-11-08",
    "changes": [
      {
        "type": "feat",
        "scope": "ai",
        "message": "add history support",
        "hash": "c64f41b"
      },
      {
        "type": "fix",
        "scope": "ai",
        "message": "fix the issue of tool call timeout",
        "hash": "a468007"
      }
    ]
  }
]

Respond ONLY with the JSON array, no other text.`;

/**
 * Get git commits from the past 7 days
 */
function getGitCommits() {
  try {
    const output = execSync(
      'git log --since="7 days ago" --pretty=format:"%h|%cd|%s|%an" --date=iso',
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    return output.trim();
  } catch (error) {
    console.error('Error fetching git commits:', error.message);
    return '';
  }
}

/**
 * Generate changelogs using Gemini AI
 */
async function generateChangelogs(commits) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log('Generating changelogs with Gemini...');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Convert these git commits to changelog format:\n\n${commits}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        topP: 0.95,
        topK: 20,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        seed: 42, // Fixed seed for reproducible output
      },
    });

    const text = response.text || '';
    console.log('Raw response:', text.substring(0, 200));

    // Parse JSON response
    let jsonText = text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const changelogs = JSON.parse(jsonText);

    // Validate structure
    if (!Array.isArray(changelogs)) {
      throw new Error('Response is not an array');
    }

    return changelogs;
  } catch (error) {
    console.error('Error generating changelogs:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching git commits from the past 7 days...');

  const commits = getGitCommits();

  if (!commits) {
    console.log('No commits found in the past 7 days');
    return;
  }

  console.log(`Found ${commits.split('\n').length} commits`);

  const changelogs = await generateChangelogs(commits);

  // Ensure output directory exists
  const outDir = path.join(process.cwd(), 'src', 'data', 'generated');
  const outFile = path.join(outDir, 'changeLogs.json');

  await fs.mkdir(outDir, { recursive: true });

  // Write JSON file
  await fs.writeFile(outFile, JSON.stringify(changelogs, null, 2) + '\n', 'utf-8');

  console.log(`✓ Changelogs written to ${outFile}`);
  console.log(`✓ Generated ${changelogs.length} days of changelogs`);

  // Count total changes
  const totalChanges = changelogs.reduce((sum, day) => sum + day.changes.length, 0);
  console.log(`✓ Total changes: ${totalChanges}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
