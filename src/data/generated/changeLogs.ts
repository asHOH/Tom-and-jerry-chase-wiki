/**
 * Type of change made in a commit
 */
export type ChangeType =
  | 'feat' // New feature
  | 'fix' // Bug fix
  | 'docs' // Documentation changes
  | 'style' // Code style changes (formatting, etc.)
  | 'refactor' // Code refactoring
  | 'perf' // Performance improvements
  | 'test' // Test additions or modifications
  | 'chore' // Build process or auxiliary tool changes
  | 'revert' // Revert previous commit
  | 'other'; // Other changes

/**
 * Represents a single change entry
 */
export interface ChangeEntry {
  type: ChangeType;
  scope?: string; // The scope of the change (e.g., 'ai', 'ui', 'data')
  message: string; // Brief description of the change
  breaking?: boolean; // Whether this is a breaking change
  hash: string; // Git commit hash (short)
  author?: string; // Commit author
}

/**
 * Changelogs grouped by date
 */
export interface DailyChangelog {
  date: string; // ISO date string (YYYY-MM-DD)
  changes: ChangeEntry[]; // List of changes for this day
}

/**
 * Root type for the changelog data
 */
export type ChangeLogs = DailyChangelog[];

// Import the generated JSON
import changeLogsData from './changeLogs.json';

export const changeLogs = changeLogsData as ChangeLogs;
