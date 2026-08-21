import type { BuildReadSummary } from './buildReadSummary';

export type PreparedBuildAttempt = {
  artifactPath: string;
  replayEpoch: number | null;
  summary: BuildReadSummary;
};

export type BuildAttemptCoordinatorDependencies = {
  maxAttempts?: number;
  prepareAttempt: (attempt: number) => Promise<PreparedBuildAttempt>;
  runOutputPipeline: (attempt: number, artifactPath: string) => Promise<void>;
  readFinalEpoch: () => Promise<{ epoch: number; durationMs: number }>;
  addFinalEpochMeasurement: (summary: BuildReadSummary, durationMs: number) => BuildReadSummary;
  cleanFailedAttempt: (artifactPath?: string) => Promise<void>;
  removeAcceptedArtifact: (artifactPath: string) => Promise<void>;
  emitSummary: (summary: BuildReadSummary) => void;
};

function isDriftError(error: unknown): error is Error & { summary: BuildReadSummary } {
  return (
    error instanceof Error &&
    (error as Error & { code?: unknown }).code === 'approved_replay_epoch_drift' &&
    'summary' in error
  );
}

export async function runBuildAttemptCoordinator(
  dependencies: BuildAttemptCoordinatorDependencies
): Promise<void> {
  const maxAttempts = dependencies.maxAttempts ?? 3;
  let lastDrift: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let prepared: PreparedBuildAttempt | undefined;
    try {
      prepared = await dependencies.prepareAttempt(attempt);
      await dependencies.runOutputPipeline(attempt, prepared.artifactPath);

      let summary = prepared.summary;
      if (prepared.replayEpoch !== null) {
        const final = await dependencies.readFinalEpoch();
        summary = dependencies.addFinalEpochMeasurement(summary, final.durationMs);
        if (final.epoch !== prepared.replayEpoch) {
          const drift = new Error('approved_replay_epoch_drift');
          (drift as Error & { code: string }).code = 'approved_replay_epoch_drift';
          (drift as Error & { summary: BuildReadSummary }).summary = summary;
          throw drift;
        }
      }

      dependencies.emitSummary(summary);
      await dependencies.removeAcceptedArtifact(prepared.artifactPath);
      return;
    } catch (error) {
      if (!isDriftError(error)) {
        await dependencies.cleanFailedAttempt(prepared?.artifactPath);
        throw error;
      }

      dependencies.emitSummary(error.summary);
      lastDrift = error;
      await dependencies.cleanFailedAttempt(prepared?.artifactPath);
      if (attempt === maxAttempts) break;
    }
  }

  throw new Error(`approved_replay_epoch_drift_after_${maxAttempts}_attempts`, {
    cause: lastDrift,
  });
}
