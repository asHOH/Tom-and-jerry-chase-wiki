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
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Do NOT change the path
// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
// const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_CHAT_MODEL || 'gemini-2.5-flash';

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
  | 'revert'    // Revert previous commit
  | 'other';    // Other changes

/**
 * Represents a single change entry processed by AI
 */
export interface AIChangeEntry {
  type: ChangeType;
  scope?: string;           // The scope of the change (e.g., 'ai', 'ui', 'data')
  message: string;          // Brief description of the change in Chinese
  breaking?: boolean;       // Whether this is a breaking change
  hashes: string[];         // Array of git commit hashes (short)
}
`.trim();

const SYSTEM_PROMPT = `你是一个更新日志生成器。将 git 提交日志转换为结构化的更新日志条目。

**输出格式：**
你必须仅返回一个 JSON 数组，不要包含任何其他文本。
JSON 应该是一个 AIChangeEntry 对象数组，具有以下确切的 TypeScript 结构：

${TYPE_DEFINITIONS}

**转换规则：**
1. 从常规提交格式（feat、fix、docs 等）中提取类型
2. 如果存在，从括号中提取范围
3. 将提交消息翻译成简洁的中文描述作为更改说明
4. 如果提交中有 "BREAKING CHANGE" 或类型中有 "!"，则标记为破坏性更改
5. **合并具有相似目的或属于同一逻辑更改的连续提交**
6. **hashes 字段必须是包含该组中所有提交哈希的数组**
7. 如果提交不遵循常规格式，将其分类为 'other'
8. **重要：message 字段必须使用中文**
9. **重要：scope 字段必须按照映射示例生成，如果不在示例中，则根据原始 scope 的清晰程度，选择翻译或不翻译（不翻译即去掉 scope 字段）；如果映射的结果为空（比如原始 scope 为 dev），则舍掉这条提交记录**

**scope 映射示例：**
- characters -> 角色信息
- character-editor -> 编辑模式
- mouseCharacters -> 鼠方角色
- catCharacters -> 猫方角色
- CharacterRelationDisplay -> 角色关系
- CharacterGrid -> 角色列表
- CharacterDetails -> 角色详情
- CharacterSection -> 角色详情
- articles -> 文章功能
- images -> 图片
- items -> 道具
- entities -> 衍生物
- contributors -> 贡献者清单
- buffs -> 状态
- TabNavigation -> 导航栏
- search -> 搜索
- ui -> 界面
- design-tokens -> 界面
- edit -> 编辑模式
- data -> 数据
- special-skills -> 特技
- knowledge-cards -> 知识卡
- ai -> ai
- docs -> 文档
- RichTextEditor -> 富文本编辑器
- navigation -> 导航栏
- SkillCard -> 角色技能
- KnowledgeCardGrid -> 知识卡列表
- SkillAllocationDisplay -> 技能加点显示
- KnowledgeCardSection -> 角色的推荐知识卡
- DisclaimerText -> 首页的网站说明
- feedback -> 反馈建议
- dark-mode -> 暗色模式
- security -> 网站安全
- offline -> 离线模式
- build -> 构建
- traits -> 特性
- tooltip -> 工具提示
- TextWithHoverTooltips -> 工具提示
- version -> 版本控制
- versioning -> 版本控制
- config -> 配置
- version-checker -> 版本检查器
- deploy -> 网站部署
- catKnowledgeCards -> 猫方知识卡
- GameImage -> 图片显示
- metadata -> 元信息
- ItemDetails -> 道具详情
- BuffGrid -> 状态列表
- BuffDetails -> 状态详情
- test -> 测试
- specialSkills -> 特技
- item-details -> 道具详情
- homepage -> 首页
- history -> 年鉴
- quick-jump -> 快速跳转
- goto -> 快速跳转
- GotoLink -> 快速跳转
- css -> 样式
- compatibility -> 浏览器兼容性
- sw -> Service Worker
- ServiceWorker -> Service Worker
- SEO -> 搜索引擎优化
- PreviewCard -> 预览卡片
- KnowledgeCardDetails -> 知识卡详情
- knowledge-card -> 知识卡
- ItemAttributesCard -> 道具属性卡片
- EntityDetails -> 衍生物详情
- ArticlesClient -> 文章列表
- routing -> 路由
- responsive -> 移动端
- loading -> 页面加载优化
- layout -> 布局
- image -> 图片
- entity-maker -> 衍生物编辑器
- dev -> 
- hooks -> 
- analytics -> 
- ci -> 
- types -> 
- readme -> 
- copilot-instructions -> 
- generate-changelogs -> 
- husky -> 
- \`{...}\`Utils -> 

**示例输入：**
c1c79d3|feat(character): add 鲍姆 basic info
9c8a5b5|feat(character): add 鲍姆 images
a468007|fix(ai): fix timeout

**示例输出：**
[
  {
    "type": "feat",
    "scope": "角色信息",
    "message": "添加角色鲍姆的基础信息和图片",
    "hashes": ["c1c79d3", "9c8a5b5"]
  },
  {
    "type": "fix",
    "scope": "ai",
    "message": "修复超时问题",
    "hashes": ["a468007"]
  }
]

仅返回 JSON 数组，不要包含其他文本。`;

/**
 * Parse git log output into structured objects and filter unwanted commits
 */
function parseCommits(rawOutput) {
  if (!rawOutput) return [];

  return rawOutput
    .split('\n')
    .map((line) => {
      const parts = line.split('|');
      if (parts.length < 4) return null;
      const hash = parts[0];
      const date = parts[1];
      const author = parts[parts.length - 1];
      const message = parts.slice(2, parts.length - 1).join('|');
      return { hash, date, message, author };
    })
    .filter((c) => c !== null)
    .filter((commit) => {
      if (!commit.message) return false;
      const msg = commit.message.toLowerCase();
      // Filter merge commits
      if (msg.includes('merge')) return false;
      // Filter chore commits
      if (msg.startsWith('chore')) return false;
      // Filter dependabot
      if (commit.author === 'dependabot[bot]') return false;
      return true;
    });
}

/**
 * Get git commits since a specific hash or from the past 7 days
 */
function getGitCommits(lastHash, untilDate) {
  try {
    let range = '--since="7 days ago"';

    if (lastHash) {
      try {
        // Check if the hash exists in the current repository
        execSync(`git rev-parse ${lastHash}`, { stdio: 'ignore', cwd: process.cwd() });
        // If it exists, get commits from that hash to HEAD
        range = `${lastHash}..HEAD`;
        console.log(`Fetching commits since ${lastHash}...`);
      } catch {
        console.warn(
          `Warning: Last commit hash ${lastHash} not found. Falling back to 7 days ago.`
        );
      }
    } else {
      console.log('No previous changelog found. Fetching commits from the past 7 days...');
    }

    let cmd = `git log ${range} --pretty=format:"%h|%cd|%s|%an" --date=iso`;

    if (untilDate) {
      // Format YYYYMMDD to YYYY-MM-DD if needed
      const formattedDate = untilDate.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
      cmd += ` --until="${formattedDate}"`;
      console.log(`Filtering commits until ${formattedDate}`);
    }

    const output = execSync(cmd, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    });

    return output.trim();
  } catch (error) {
    console.error('Error fetching git commits:', error.message);
    return '';
  }
}

// Convert error-like values into a readable string for logs
function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Generate changelogs without AI (fallback)
 */
function generateFallbackChangelogs(commits) {
  console.log('Generating changelogs without AI (fallback mode)...');
  const changesByDate = {};

  for (const commit of commits) {
    const date = commit.date.split(' ')[0]; // YYYY-MM-DD

    // Parse conventional commit
    // feat(scope): message
    const match = commit.message.match(/^(\w+)(?:\(([^)]+)\))?(!?):\s*(.+)$/);

    let type = 'other';
    let scope = undefined;
    let message = commit.message;
    let breaking = false;

    if (match) {
      type = match[1];
      scope = match[2];
      breaking = match[3] === '!' || commit.message.includes('BREAKING CHANGE');
      message = match[4];
    }

    if (!changesByDate[date]) {
      changesByDate[date] = [];
    }

    changesByDate[date].push({
      type,
      scope,
      message,
      breaking,
      hashes: [commit.hash],
      author: commit.author,
    });
  }

  // Convert to array
  const result = Object.keys(changesByDate).map((date) => ({
    date,
    changes: changesByDate[date],
  }));

  // Sort days descending
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return result;
}

/**
 * Generate changelogs using Gemini AI
 */
async function generateChangelogs(commits) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  console.log('Generating changelogs with Gemini...');

  // Prepare input for AI: hash|message
  const commitsInput = commits.map((c) => `${c.hash}|${c.message}`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Convert these git commits to changelog format:\n\n${commitsInput}`,
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
        responseJsonSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'ChangeLogs',
          description: 'List of processed changes.',
          type: 'array',
          items: {
            type: 'object',
            description: 'Represents a single change entry processed by AI.',
            properties: {
              type: {
                type: 'string',
                description: 'Type of change made in a commit.',
                enum: [
                  'feat',
                  'fix',
                  'docs',
                  'style',
                  'refactor',
                  'perf',
                  'test',
                  'revert',
                  'other',
                ],
              },
              scope: {
                type: 'string',
                description: "The scope of the change (e.g., 'ai', 'ui', 'data').",
              },
              message: {
                type: 'string',
                description: 'Brief description of the change in Chinese.',
              },
              breaking: {
                type: 'boolean',
                description: 'Whether this is a breaking change.',
              },
              hashes: {
                type: 'array',
                description: 'Array of git commit hashes (short format).',
                items: { type: 'string' },
              },
            },
            required: ['type', 'message', 'hashes'],
          },
        },
        seed: 42, // Fixed seed for reproducible output
      },
    });
    const aiChanges = JSON.parse(response.text);

    // Validate structure
    if (!Array.isArray(aiChanges)) {
      throw new Error('Response is not an array');
    }

    // Merge AI results with original commit data (date, author) and group by date
    const commitMap = new Map(commits.map((c) => [c.hash, c]));
    const changesByDate = {};

    for (const aiChange of aiChanges) {
      // Find original commits
      const groupCommits = aiChange.hashes.map((h) => commitMap.get(h)).filter((c) => c);

      if (groupCommits.length === 0) continue;

      // Use the date of the newest commit (first in the list usually, but let's sort to be sure)
      // Commits are strings "YYYY-MM-DD ...". Lexicographical sort works for ISO date part.
      groupCommits.sort((a, b) => b.date.localeCompare(a.date));
      const primaryCommit = groupCommits[0];
      const date = primaryCommit.date.split(' ')[0];

      // Authors
      const authors = [...new Set(groupCommits.map((c) => c.author))].join(', ');

      if (!changesByDate[date]) {
        changesByDate[date] = [];
      }

      changesByDate[date].push({
        type: aiChange.type,
        scope: aiChange.scope,
        message: aiChange.message,
        breaking: aiChange.breaking,
        hashes: aiChange.hashes,
        author: authors,
      });
    }

    // Convert to array
    const result = Object.keys(changesByDate).map((date) => ({
      date,
      changes: changesByDate[date],
    }));

    // Sort days descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  } catch (error) {
    console.error('Error generating changelogs:', formatError(error));
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dateArg = args.find((arg) => arg.startsWith('--date='));
  const untilDate = dateArg ? dateArg.split('=')[1] : null;
  const noAi = args.includes('--no-ai');

  const outDir = path.join(process.cwd(), 'src', 'data', 'generated');
  const outFile = path.join(outDir, 'changeLogs.json');

  let existingChangelogs = [];
  let lastHash = null;

  // Try to read existing changelogs
  try {
    const data = await fs.readFile(outFile, 'utf-8');
    existingChangelogs = JSON.parse(data);

    // Find the latest commit hash from the existing logs
    // Assuming the logs are sorted by date descending, and changes within date are sorted by time descending
    if (Array.isArray(existingChangelogs) && existingChangelogs.length > 0) {
      // Check the first day's changes
      const latestDay = existingChangelogs[0];
      if (latestDay.changes && latestDay.changes.length > 0) {
        const latestChange = latestDay.changes[0];
        if (Array.isArray(latestChange.hashes) && latestChange.hashes.length > 0) {
          lastHash = latestChange.hashes[0];
        }
        console.log(`Found latest existing commit: ${lastHash} (${latestDay.date})`);
      }
    }
  } catch {
    // File doesn't exist or is invalid, start fresh
    console.log('No valid existing changelog file found. Starting fresh.');
  }

  const rawCommits = getGitCommits(lastHash, untilDate);

  if (!rawCommits) {
    console.log('No new commits found.');
    return;
  }

  const parsedCommits = parseCommits(rawCommits);
  console.log(`Found ${parsedCommits.length} relevant commits`);

  if (parsedCommits.length === 0) {
    console.log('No relevant commits to process.');
    return;
  }

  let newChangelogs;

  if (noAi) {
    newChangelogs = generateFallbackChangelogs(parsedCommits);
  } else {
    try {
      newChangelogs = await generateChangelogs(parsedCommits);
    } catch (error) {
      console.warn(
        'Warning: Failed to generate changelogs with Gemini. Skipping changelog update.'
      );
      console.warn(`Details: ${formatError(error)}`);
      return;
    }
  }

  // Merge new changelogs with existing ones
  const mergedChangelogs = [...existingChangelogs];

  // Iterate through new changelogs (which are sorted by date descending)
  // Since we want to merge them into existing logs
  for (const newDay of newChangelogs) {
    const existingDayIndex = mergedChangelogs.findIndex((d) => d.date === newDay.date);

    if (existingDayIndex !== -1) {
      // Day exists, merge changes
      // Filter out any duplicates just in case (though git log range should prevent this)
      const existingChanges = mergedChangelogs[existingDayIndex].changes;

      // Collect all existing hashes for deduplication
      const existingHashes = new Set();
      existingChanges.forEach((c) => {
        if (Array.isArray(c.hashes)) {
          c.hashes.forEach((h) => existingHashes.add(h));
        }
      });

      const uniqueNewChanges = newDay.changes.filter((c) => {
        // Check if ANY of the new hashes exist in existing hashes
        return !c.hashes.some((h) => existingHashes.has(h));
      });

      if (uniqueNewChanges.length > 0) {
        // Prepend new changes since they are newer
        mergedChangelogs[existingDayIndex].changes = [...uniqueNewChanges, ...existingChanges];
      }
    } else {
      // Day doesn't exist, insert it
      mergedChangelogs.push(newDay);
    }
  }

  // Sort by date descending
  mergedChangelogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Ensure output directory exists
  await fs.mkdir(outDir, { recursive: true });

  // Write JSON file
  await fs.writeFile(outFile, JSON.stringify(mergedChangelogs, null, 2) + '\n', 'utf-8');

  console.log(`✓ Changelogs updated in ${outFile}`);

  // Count new changes
  const newChangesCount = newChangelogs.reduce((sum, day) => sum + day.changes.length, 0);
  console.log(`✓ Added ${newChangesCount} new changes`);

  // Count total changes
  const totalChanges = mergedChangelogs.reduce((sum, day) => sum + day.changes.length, 0);
  console.log(`✓ Total changes: ${totalChanges}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
