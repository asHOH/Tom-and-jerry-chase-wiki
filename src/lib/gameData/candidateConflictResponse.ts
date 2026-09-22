import 'server-only';

import { NextResponse } from 'next/server';

import { ACTION_PROCESSING_ERROR_CODES, type ActionProcessingErrorCode } from './actionErrors';
import type { PublishRouteName } from './publishPreparationResponse';
import type { TrustedGameDataMutationError } from './trustedGameDataMutations';

const CANDIDATE_CONFLICT_MESSAGE =
  '发布前的数据兼容性检查未通过。草稿已保留，请将请求编号提供给管理员。';
const MAX_DIAGNOSTIC_TEXT_LENGTH = 256;
const MAX_DIAGNOSTIC_ID_LENGTH = 128;
const actionProcessingErrorCodes: ReadonlySet<string> = new Set(ACTION_PROCESSING_ERROR_CODES);
const replayStages = new Set(['parse', 'backup', 'apply', 'rollback']);
const actionOperations = new Set(['set', 'add', 'delete']);

type CandidateConflictReplayDiagnostic = {
  code: ActionProcessingErrorCode;
  stage?: 'parse' | 'backup' | 'apply' | 'rollback';
  operation?: 'set' | 'add' | 'delete';
  path?: string;
  rowId?: string;
  actionIndex?: number;
  targetIndex?: number;
  rootKey?: string;
  segmentIndex?: number;
  segment?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function boundedString(value: unknown, maxLength: number): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, maxLength) : undefined;
}

function nonNegativeInteger(value: unknown): number | undefined {
  return Number.isInteger(value) && (value as number) >= 0 ? (value as number) : undefined;
}

function candidateConflictReplayDiagnostic(
  cause: unknown
): CandidateConflictReplayDiagnostic | undefined {
  if (!isRecord(cause) || !isRecord(cause.detail)) return undefined;
  const { detail } = cause;
  if (typeof detail.code !== 'string' || !actionProcessingErrorCodes.has(detail.code)) {
    return undefined;
  }

  const stage =
    typeof detail.stage === 'string' && replayStages.has(detail.stage)
      ? (detail.stage as CandidateConflictReplayDiagnostic['stage'])
      : undefined;
  const operation =
    typeof detail.operation === 'string' && actionOperations.has(detail.operation)
      ? (detail.operation as CandidateConflictReplayDiagnostic['operation'])
      : undefined;
  const path = boundedString(detail.path, MAX_DIAGNOSTIC_TEXT_LENGTH);
  const rowId = boundedString(detail.rowId, MAX_DIAGNOSTIC_ID_LENGTH);
  const rootKey = boundedString(detail.rootKey, MAX_DIAGNOSTIC_TEXT_LENGTH);
  const segment = boundedString(detail.segment, MAX_DIAGNOSTIC_TEXT_LENGTH);
  const actionIndex = nonNegativeInteger(detail.actionIndex);
  const targetIndex = nonNegativeInteger(detail.targetIndex);
  const segmentIndex = nonNegativeInteger(detail.segmentIndex);

  return {
    code: detail.code as ActionProcessingErrorCode,
    ...(stage === undefined ? {} : { stage }),
    ...(operation === undefined ? {} : { operation }),
    ...(path === undefined ? {} : { path }),
    ...(rowId === undefined ? {} : { rowId }),
    ...(actionIndex === undefined ? {} : { actionIndex }),
    ...(targetIndex === undefined ? {} : { targetIndex }),
    ...(rootKey === undefined ? {} : { rootKey }),
    ...(segmentIndex === undefined ? {} : { segmentIndex }),
    ...(segment === undefined ? {} : { segment }),
  };
}

export function candidateConflictResponse(
  error: TrustedGameDataMutationError,
  route: PublishRouteName
): NextResponse {
  const requestId = crypto.randomUUID();
  const replayError = candidateConflictReplayDiagnostic(error.cause);

  console.warn(
    'game_data_publish_rejected',
    JSON.stringify({
      event: 'candidate_conflict',
      requestId,
      route,
      ...(replayError === undefined ? {} : { replayError }),
    })
  );

  return NextResponse.json(
    {
      error: error.code,
      message: CANDIDATE_CONFLICT_MESSAGE,
      requestId,
    },
    { status: 409 }
  );
}

type StaleEditContext = 'submission' | 'approval';

function staleEditPath(error: TrustedGameDataMutationError): string {
  if (!isRecord(error.cause) || !isRecord(error.cause.detail)) return '未知字段';
  return boundedString(error.cause.detail.path, MAX_DIAGNOSTIC_TEXT_LENGTH) ?? '未知字段';
}

export function staleGameDataEditMessage(
  error: TrustedGameDataMutationError,
  context: StaleEditContext
): string {
  const path = staleEditPath(error);
  const arrayContextRequired =
    isRecord(error.cause) &&
    isRecord(error.cause.detail) &&
    error.cause.detail.reason === 'array_context_required';
  const conflict = arrayContextRequired
    ? `字段「${path}」缺少完整的原始列表`
    : `字段「${path}」已发生变化`;

  if (context === 'approval') {
    return `待审核改动涉及的${conflict}，仍保持待审核。请核对差异，并联系提交者基于最新数据重新提交。`;
  }

  return `提交已拒绝：${conflict}，草稿已保留。请先保存想保留的内容，放弃旧草稿并刷新到最新数据，再手动重做后提交。`;
}

export function staleGameDataEditResponse(
  error: TrustedGameDataMutationError,
  context: StaleEditContext
): NextResponse {
  return NextResponse.json(
    { error: error.code, message: staleGameDataEditMessage(error, context) },
    { status: 409 }
  );
}
