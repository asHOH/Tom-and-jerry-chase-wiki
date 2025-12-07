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
  hash: string;             // Git commit hash (short)
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
5. 包含短 git 哈希
6. 如果提交不遵循常规格式，将其分类为 'other'
7. 保持描述简洁且用户友好
8. **重要：message 字段必须使用中文**
9. **重要：scope 字段必须按照映射示例生成，如果不在示例中，则根据原始 scope 的清晰程度，选择翻译或不翻译（不翻译即去掉 scope 字段）；如果映射的结果为空（比如原始 scope 为 dev），则舍掉这条提交记录**

**scope 映射示例：**
- characters -> 角色信息
- character-editor -> 编辑模式
- mouseCharacters -> 鼠方角色
- articles -> 文章功能
- catCharacters -> 猫方角色
- images -> 图片
- items -> 道具
- entities -> 衍生物
- contributors -> 贡献者清单
- buffs -> 状态和效果
- TabNavigation -> 导航栏
- search -> 搜索
- ui -> 界面
- design-tokens -> 界面
- CharacterRelationDisplay -> 角色关系
- edit -> 编辑模式
- data -> 数据
- special-skills -> 特技
- knowledge-cards -> 知识卡
- ai -> ai
- CharacterGrid -> 角色列表
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
- CharacterDetails -> 角色详情
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
- CharacterSection -> 角色详情
- metadata -> 元信息
- VersionChecker -> 版本检查器
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
- character-detail -> 角色详情
- sw -> Service Worker
- ServiceWorker -> Service Worker
- SEO -> 搜索引擎优化
- PreviewCard -> 预览卡片
- KnowledgeCardDetails -> 知识卡详情
- ItemAttributesCard -> 道具属性卡片
- EntityDetails -> 衍生物详情
- ArticlesClient -> 文章列表
- routing -> 路由
- responsive -> 移动端兼容
- mouse-characters -> 鼠方角色
- loading -> 页面加载优化
- layout -> 布局
- knowledge-card-details -> 知识卡详情
- knowledge-card -> 知识卡
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
c1c79d3|feat(character,images): add 鲍姆 information
9c8a5b5|fix(GotoLink): adjust width for preview content

**示例输出：**
[
  {
    "type": "feat",
    "scope": "角色信息,图片",
    "message": "添加角色鲍姆的图片数据",
    "hash": "c1c79d3"
  },
  {
    "type": "fix",
    "scope": "快速跳转连接",
    "message": "调整预览内容的宽度",
    "hash": "9c8a5b5"
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
function getGitCommits(lastHash) {
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

    const output = execSync(`git log ${range} --pretty=format:"%h|%cd|%s|%an" --date=iso`, {
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
              hash: {
                type: 'string',
                description: 'Git commit hash (short format).',
              },
            },
            required: ['type', 'message', 'hash'],
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
    const aiChangesMap = new Map(aiChanges.map((c) => [c.hash, c]));
    const changesByDate = {};

    for (const commit of commits) {
      const aiChange = aiChangesMap.get(commit.hash);
      if (!aiChange) continue;

      // Extract date (YYYY-MM-DD) from ISO string (e.g., 2025-11-08 13:00:00 +0800)
      const date = commit.date.split(' ')[0];

      if (!changesByDate[date]) {
        changesByDate[date] = [];
      }

      changesByDate[date].push({
        type: aiChange.type,
        scope: aiChange.scope,
        message: aiChange.message,
        breaking: aiChange.breaking,
        hash: commit.hash,
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
  } catch (error) {
    console.error('Error generating changelogs:', formatError(error));
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
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
        lastHash = latestDay.changes[0].hash;
        console.log(`Found latest existing commit: ${lastHash} (${latestDay.date})`);
      }
    }
  } catch {
    // File doesn't exist or is invalid, start fresh
    console.log('No valid existing changelog file found. Starting fresh.');
  }

  const rawCommits = getGitCommits(lastHash);

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

  try {
    newChangelogs = await generateChangelogs(parsedCommits);
  } catch (error) {
    console.warn('Warning: Failed to generate changelogs with Gemini. Skipping changelog update.');
    console.warn(`Details: ${formatError(error)}`);
    return;
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
      const existingHashes = new Set(existingChanges.map((c) => c.hash));

      const uniqueNewChanges = newDay.changes.filter((c) => !existingHashes.has(c.hash));

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
