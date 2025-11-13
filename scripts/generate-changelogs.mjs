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
const GEMINI_MODEL = 'gemini-2.5-pro';
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
13. **重要：scope 字段必须按照映射示例生成，如果不在示例中，则根据原始 scope 的清晰程度，选择翻译或不翻译（不翻译即去掉 scope 字段）；如果映射的结果为空（比如原始 scope 为 dev），则舍掉这条提交记录**

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
- dev -> 
- SkillCard -> 角色技能
- KnowledgeCardGrid -> 知识卡列表
- design-tokens -> 设计令牌
- SkillAllocationDisplay -> 技能加点显示
- KnowledgeCardSection -> 角色的推荐知识卡
- DisclaimerText -> 首页的网站说明
- feedback -> 反馈建议
- ci -> ci
- types -> 代码类型
- readme -> 
- dark-mode -> 暗色模式
- CharacterDetails -> 角色详情
- templates -> 数据模板（已废弃）
- security -> 网站安全
- offline -> 离线模式
- build -> 构建
- traits -> 特性（交互关系）
- tooltip -> 工具提示
- copilot-instructions -> 
- TextWithHoverTooltips -> 工具提示
- version -> 版本控制
- template -> 模板（已废弃）
- config -> 配置
- Tooltip -> 工具提示
- README -> 
- version-checker -> 版本检查器
- sw -> Service Worker
- quick-jump -> 快速跳转
- deploy -> 网站部署
- catKnowledgeCards -> 猫方知识卡
- GotoLink -> 快速跳转连接
- GameImage -> 图片显示
- CharacterSection -> 角色详情
- metadata -> 元信息
- VersionChecker -> 版本检查器
- ItemDetails -> 道具详情
- BuffGrid -> 状态和效果列表
- BuffDetails -> 状态和效果的详情
- versioning -> 版本
- tests -> 测试
- test -> 测试
- specialSkills -> 特技
- seo -> 搜索引擎优化
- item-details -> 道具详情
- hooks -> 提交钩子或React Hooks
- homepage -> 首页
- history -> 年鉴
- goto -> 快速跳转
- css -> 样式
- compatibility -> 浏览器兼容性
- character-detail -> 角色详情
- analytics -> 网站分析
- ServiceWorker -> Service Worker
- SEO -> 搜索引擎优化
- PreviewCard -> \`{...}\`的预览卡片
- KnowledgeCardDetails -> 知识卡详情
- ItemAttributesCard -> 道具属性卡片
- EntityDetails -> 衍生物详情
- CharacterImport -> 角色导入（编辑模式）
- ArticlesClient -> 文章列表
- tooltipUtils -> 工具提示
- routing -> 路由
- responsive -> 移动端兼容
- mouse-characters -> 鼠方角色
- loading -> 页面加载优化
- layout -> 布局
- knowledge-card-details -> 知识卡详情
- knowledge-card -> 知识卡
- image -> 图片
- husky -> 
- entity-maker -> 衍生物编辑器

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
        "scope": "角色信息,图片",
        "message": "添加角色鲍姆的图片数据",
        "hash": "c1c79d3",
        "author": "ConductorJerry"
      },
      {
        "type": "fix",
        "scope": "快速跳转连接",
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
        responseJsonSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'ChangeLogs',
          description:
            'Root type for the changelog data. Represents an array of changelogs grouped by date.',
          type: 'array',
          items: {
            type: 'object',
            description: 'Changelogs grouped by date.',
            properties: {
              date: {
                type: 'string',
                format: 'date',
                description: 'ISO date string (YYYY-MM-DD).',
              },
              changes: {
                type: 'array',
                description: 'List of changes for this day.',
                items: {
                  type: 'object',
                  description: 'Represents a single change entry.',
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
                        'chore',
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
                      description: 'Brief description of the change.',
                    },
                    breaking: {
                      type: 'boolean',
                      description: 'Whether this is a breaking change.',
                    },
                    hash: {
                      type: 'string',
                      description: 'Git commit hash (short format).',
                    },
                    author: {
                      type: 'string',
                      description: 'Commit author.',
                    },
                  },
                  required: ['type', 'message', 'hash'],
                },
              },
            },
            required: ['date', 'changes'],
          },
        },
        seed: 42, // Fixed seed for reproducible output
      },
    });
    const changelogs = JSON.parse(response.text);

    // Validate structure
    if (!Array.isArray(changelogs)) {
      throw new Error('Response is not an array');
    }

    return changelogs;
  } catch (error) {
    console.error('Error generating changelogs:', formatError(error));
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

  let changelogs;

  try {
    changelogs = await generateChangelogs(commits);
  } catch (error) {
    console.warn('Warning: Failed to generate changelogs with Gemini. Skipping changelog update.');
    console.warn(`Details: ${formatError(error)}`);
    console.warn('Tip: Re-run scripts/generate-changelogs.mjs once the Gemini service recovers.');
    return;
  }

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
