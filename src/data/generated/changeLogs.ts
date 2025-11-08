/**
 * 提交中所做的更改类型
 * Type of change made in a commit
 */
export type ChangeType =
  | 'feat' // 新功能 (New feature)
  | 'fix' // 错误修复 (Bug fix)
  | 'docs' // 文档更改 (Documentation changes)
  | 'style' // 代码样式更改（格式化等）(Code style changes)
  | 'refactor' // 代码重构 (Code refactoring)
  | 'perf' // 性能改进 (Performance improvements)
  | 'test' // 测试添加或修改 (Test additions or modifications)
  | 'chore' // 构建过程或辅助工具更改 (Build process or auxiliary tool changes)
  | 'revert' // 还原先前的提交 (Revert previous commit)
  | 'other'; // 其他更改 (Other changes)

/**
 * 表示单个更改条目
 * Represents a single change entry
 */
export interface ChangeEntry {
  type: ChangeType;
  scope?: string; // 更改的范围（例如 'ai'、'ui'、'data'）(The scope of the change)
  message: string; // 更改的简要描述（中文）(Brief description of the change in Chinese)
  breaking?: boolean; // 是否为破坏性更改 (Whether this is a breaking change)
  hash: string; // Git 提交哈希（短格式）(Git commit hash - short)
  author?: string; // 提交作者 (Commit author)
}

/**
 * 按日期分组的更新日志
 * Changelogs grouped by date
 */
export interface DailyChangelog {
  date: string; // ISO 日期字符串（YYYY-MM-DD）(ISO date string)
  changes: ChangeEntry[]; // 当天的更改列表 (List of changes for this day)
}

/**
 * 更新日志数据的根类型
 * Root type for the changelog data
 */
export type ChangeLogs = DailyChangelog[];

// Import the generated JSON
import changeLogsData from './changeLogs.json';

export const changeLogs = changeLogsData as ChangeLogs;
