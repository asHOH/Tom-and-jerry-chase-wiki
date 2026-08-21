import 'server-only';

import { Buffer } from 'node:buffer';

import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';

import {
  createApprovedActionArtifactPayload,
  type ApprovedActionArtifactPayload,
} from './approvedActionArtifact';
import {
  BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
  type BuildGameDataArtifact,
} from './buildArtifactSchema';
import {
  createBuildReadSummary,
  type BuildReadSummary,
  type BuildReadSummaryInput,
} from './buildReadSummary';
import {
  createCharacterContributorArtifactPayload,
  type CharacterContributorArtifactPayload,
  type CharacterContributorSourcePayload,
} from './characterContributors';
import {
  createSyncedHistoryArtifactPayload,
  type SyncedHistoryArtifactPayload,
  type SyncedHistorySourcePayload,
} from './syncedHistory';

export type BuildGameDataPrepassDependencies = {
  queryContributors: () => Promise<CharacterContributorSourcePayload>;
  querySyncedHistory: () => Promise<SyncedHistorySourcePayload>;
  readReplayEpoch: () => Promise<number>;
  queryApprovedActions: () => Promise<{
    rows: PublicActionRow[];
    exactCount: number;
  }>;
  now?: () => number;
  isoNow?: () => string;
};

export type BuildGameDataPrepassResult = {
  artifact: BuildGameDataArtifact;
  summary: BuildReadSummary;
  replayEpoch: number | null;
};

export class BuildReplayEpochDriftError extends Error {
  readonly code = 'approved_replay_epoch_drift';

  constructor(public readonly summary: BuildReadSummary) {
    super('approved_replay_epoch_drift');
    this.name = 'BuildReplayEpochDriftError';
  }
}

function elapsed(start: number, now: () => number): number {
  return Math.max(0, Math.round(now() - start));
}

function serializedBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), 'utf8');
}

function emptyPayloads(): {
  approvedActions: ApprovedActionArtifactPayload;
  contributors: CharacterContributorArtifactPayload;
  syncedHistory: SyncedHistoryArtifactPayload;
} {
  return {
    approvedActions: createApprovedActionArtifactPayload(null, 0, []),
    contributors: createCharacterContributorArtifactPayload({
      sourceActionCount: 0,
      rowCount: 0,
      rows: [],
    }),
    syncedHistory: createSyncedHistoryArtifactPayload({
      sourceActionCount: 0,
      rowCount: 0,
      operationCount: 0,
      rows: [],
    }),
  };
}

export function createDisabledBuildGameDataPrepass(
  attempt: number,
  deploymentIdentity: string,
  isoNow: () => string = () => new Date().toISOString()
): BuildGameDataPrepassResult {
  const payloads = emptyPayloads();
  return {
    artifact: {
      schemaVersion: BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
      deploymentIdentity,
      fetchedAt: isoNow(),
      ...payloads,
    },
    replayEpoch: null,
    summary: createBuildReadSummary({
      attempt,
      mode: 'disabled',
      sources: [
        {
          source: 'approved-actions',
          fetchCount: 0,
          rowCount: 0,
          serializedBytes: 0,
          durationMs: 0,
          checksum: null,
        },
        {
          source: 'character-contributors',
          fetchCount: 0,
          rowCount: 0,
          serializedBytes: 0,
          durationMs: 0,
          checksum: null,
        },
        {
          source: 'synced-history',
          fetchCount: 0,
          rowCount: 0,
          serializedBytes: 0,
          durationMs: 0,
          checksum: null,
        },
      ],
      epochValidation: { checkCount: 0, durationMs: 0 },
    }),
  };
}

export async function createEnabledBuildGameDataPrepass(
  attempt: number,
  deploymentIdentity: string,
  dependencies: BuildGameDataPrepassDependencies
): Promise<BuildGameDataPrepassResult> {
  const now = dependencies.now ?? (() => performance.now());
  const isoNow = dependencies.isoNow ?? (() => new Date().toISOString());

  const contributorStart = now();
  const contributorSource = await dependencies.queryContributors();
  const contributors = createCharacterContributorArtifactPayload(contributorSource);
  const contributorDuration = elapsed(contributorStart, now);

  const historyStart = now();
  const historySource = await dependencies.querySyncedHistory();
  const syncedHistory = createSyncedHistoryArtifactPayload(historySource);
  const historyDuration = elapsed(historyStart, now);

  const epochStart = now();
  const epochBefore = await dependencies.readReplayEpoch();

  const approvedStart = now();
  const approvedSource = await dependencies.queryApprovedActions();
  const approvedActions = createApprovedActionArtifactPayload(
    epochBefore,
    approvedSource.exactCount,
    approvedSource.rows
  );
  const approvedDuration = elapsed(approvedStart, now);

  const epochAfter = await dependencies.readReplayEpoch();
  const epochDuration = elapsed(epochStart, now) - approvedDuration;

  const summaryInput: BuildReadSummaryInput = {
    attempt,
    mode: 'enabled',
    sources: [
      {
        source: 'approved-actions',
        fetchCount: 1,
        rowCount: approvedActions.rowCount,
        serializedBytes: serializedBytes(approvedSource.rows),
        durationMs: approvedDuration,
        checksum: approvedActions.checksum,
      },
      {
        source: 'character-contributors',
        fetchCount: 1,
        rowCount: contributorSource.rowCount,
        serializedBytes: serializedBytes(contributorSource),
        durationMs: contributorDuration,
        checksum: contributors.checksum,
      },
      {
        source: 'synced-history',
        fetchCount: 1,
        rowCount: syncedHistory.rowCount,
        serializedBytes: serializedBytes(historySource),
        durationMs: historyDuration,
        checksum: syncedHistory.checksum,
      },
    ],
    epochValidation: { checkCount: 2, durationMs: Math.max(0, epochDuration) },
  };
  const summary = createBuildReadSummary(summaryInput);

  if (epochBefore !== epochAfter) throw new BuildReplayEpochDriftError(summary);

  return {
    artifact: {
      schemaVersion: BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
      deploymentIdentity,
      fetchedAt: isoNow(),
      approvedActions,
      contributors,
      syncedHistory,
    },
    replayEpoch: epochBefore,
    summary,
  };
}

export function addFinalEpochMeasurement(
  summary: BuildReadSummary,
  durationMs: number
): BuildReadSummary {
  return createBuildReadSummary({
    ...summary,
    epochValidation: {
      checkCount: summary.epochValidation.checkCount + 1,
      durationMs: summary.epochValidation.durationMs + Math.max(0, Math.round(durationMs)),
    },
  });
}
