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
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

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
const SYSTEM_PROMPT = `你是一个更新日志生成器。将 git 提交日志转换为结构化的更新日志条目。

**输出格式：**
你必须仅返回一个有效的 JSON 数组，不要包含任何其他文本、markdown 格式或代码块。
JSON 应该是一个 DailyChangelog 对象数组，具有以下确切的 TypeScript 结构：

${TYPE_DEFINITIONS}

**转换规则：**
1. **过滤提交：跳过以下提交，不要包含在输出中：**
   - 合并提交（消息包含 "Merge"、"merge"、"合并" 等）
   - 作者为 "dependabot[bot]" 的提交
2. 按日期（YYYY-MM-DD 格式）对提交进行分组
3. 从常规提交格式（feat、fix、docs 等）中提取类型
4. 如果存在，从括号中提取范围
5. 将提交消息翻译成简洁的中文描述作为更改说明
6. 如果提交中有 "BREAKING CHANGE" 或类型中有 "!"，则标记为破坏性更改
7. 包含短 git 哈希（前 7 个字符）
8. 按降序排列日期（最新的在前）
9. **在每一天内，按提交时间排序（最新的在前）**
10. 如果提交不遵循常规格式，将其分类为 'other'
11. 保持描述简洁且用户友好
12. **重要：message 字段必须使用中文**

**示例输入：**
c1c79d3|2025-11-08 13:00:00 +0800|feat(character,images): add 鲍姆 information|ConductorJerry
9c8a5b5|2025-11-08 12:00:00 +0800|fix(GotoLink): adjust width for preview content|asHOH
a468007|2025-11-08 11:00:00 +0800|fix(ai): fix the issue of tool call timeout|3swordman
d123456|2025-11-08 10:00:00 +0800|Merge pull request #123|asHOH
e789012|2025-11-08 09:00:00 +0800|chore(deps): bump some-package|dependabot[bot]

**示例输出：**
[
  {
    "date": "2025-11-08",
    "changes": [
      {
        "type": "feat",
        "scope": "character,images",
        "message": "添加角色鲍姆的图片数据",
        "hash": "c1c79d3",
        "author": "ConductorJerry"
      },
      {
        "type": "fix",
        "scope": "GotoLink",
        "message": "调整预览内容的宽度",
        "hash": "9c8a5b5",
        "author": "asHOH"
      },
      {
        "type": "fix",
        "scope": "ai",
        "message": "修复工具调用超时问题",
        "hash": "a468007",
        "author": "3swordman"
      }
    ]
  }
]

注意：合并提交和 dependabot 的提交已被过滤，更改按时间排序（最新的在前）。

仅返回 JSON 数组，不要包含其他文本。`;

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
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
        seed: 42, // Fixed seed for reproducible output
      },
    });

    // Extract text from response
    let text = '';
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        text = candidate.content.parts.map((part) => part.text || '').join('');
      }
    }

    // Fallback to response.text if available
    if (!text && response.text) {
      text = response.text;
    }

    if (!text) {
      throw new Error('Empty response from API');
    }

    console.log('Response length:', text.length, 'characters');

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
