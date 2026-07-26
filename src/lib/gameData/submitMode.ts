import type { PermissionKey, ResourceContext } from '@/lib/auth/permissions';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import type { Database, Json } from '@/data/database.types';

export const GAME_DATA_SUBMIT_MODES = ['default', 'force_public_pending', 'force_pending'] as const;

export type GameDataSubmitMode = (typeof GAME_DATA_SUBMIT_MODES)[number];
export type GameDataSubmitOutcome = 'pending' | 'public_pending' | 'approved';

export type GameDataAdvancedSubmit = {
  available: boolean;
  defaultOutcome: GameDataSubmitOutcome;
  modes: readonly GameDataSubmitMode[];
};

type GameDataSubmitPermission = Extract<
  PermissionKey,
  'game_data_action.auto_approve' | 'game_data_action.approve'
>;

type SubmitPermissionChecker = (
  permission: GameDataSubmitPermission,
  contexts: readonly ResourceContext[]
) => boolean;

type PublishResultRow = Pick<
  Database['public']['Functions']['prepared_publish_game_data_actions']['Returns'][number],
  'is_public' | 'status'
>;

export function isGameDataSubmitMode(value: unknown): value is GameDataSubmitMode {
  return typeof value === 'string' && (GAME_DATA_SUBMIT_MODES as readonly string[]).includes(value);
}

export function resolveGameDataAdvancedSubmit(args: {
  entityType: string;
  entries: readonly Json[];
  canAll: SubmitPermissionChecker;
}): GameDataAdvancedSubmit {
  if (args.entries.length === 0) {
    return {
      available: false,
      defaultOutcome: 'pending',
      modes: ['default'],
    };
  }

  const contexts = getGameActionResourceContexts(args.entityType, args.entries);
  const canAutoApprove = args.canAll('game_data_action.auto_approve', contexts);
  if (!canAutoApprove) {
    return {
      available: false,
      defaultOutcome: 'pending',
      modes: ['default'],
    };
  }

  const canApprove = args.canAll('game_data_action.approve', contexts);
  return {
    available: true,
    defaultOutcome: canApprove ? 'approved' : 'public_pending',
    modes: canApprove
      ? ['default', 'force_public_pending', 'force_pending']
      : ['default', 'force_pending'],
  };
}

export function getGameDataSubmitOutcomeForMode(
  submitMode: GameDataSubmitMode,
  defaultOutcome: GameDataSubmitOutcome
): GameDataSubmitOutcome {
  if (submitMode === 'force_pending') return 'pending';
  if (submitMode === 'force_public_pending') return 'public_pending';
  return defaultOutcome;
}

export function getGameDataSubmitModeLabel(
  submitMode: GameDataSubmitMode,
  defaultOutcome: GameDataSubmitOutcome
): string {
  if (submitMode === 'force_public_pending') return '仅自动公开';
  if (submitMode === 'force_pending') return '普通提交';

  if (defaultOutcome === 'approved') return '自动审核并公开';
  if (defaultOutcome === 'public_pending') return '自动公开';
  return '普通提交';
}

export function getGameDataSubmitModeDescription(
  submitMode: GameDataSubmitMode,
  defaultOutcome: GameDataSubmitOutcome
): string {
  if (submitMode === 'force_public_pending') {
    return '本次将自动公开，提交后仍可被复核或撤销。';
  }

  const outcome = getGameDataSubmitOutcomeForMode(submitMode, defaultOutcome);
  if (outcome === 'approved') {
    return '当前将自动审核通过并公开显示。';
  }
  if (outcome === 'public_pending') {
    return '本次将自动公开，提交后仍可被复核或撤销。';
  }
  return '按普通提交处理，提交后等待审核。';
}

export function getGameDataSubmitOutcomeFromResults(
  results: readonly PublishResultRow[]
): GameDataSubmitOutcome {
  if (results.some((result) => result.status === 'approved')) return 'approved';
  if (results.some((result) => result.is_public)) return 'public_pending';
  return 'pending';
}

export function getGameDataSubmitSuccessMessage(
  subject: '改动' | '关系修改',
  outcome: GameDataSubmitOutcome
): string {
  if (outcome === 'approved') {
    return `${subject}已提交，已自动审核通过并公开`;
  }
  if (outcome === 'public_pending') {
    return `${subject}已提交，已自动公开，后续仍可复核`;
  }
  return `${subject}已提交，等待审核`;
}
