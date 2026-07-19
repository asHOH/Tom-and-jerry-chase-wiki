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
