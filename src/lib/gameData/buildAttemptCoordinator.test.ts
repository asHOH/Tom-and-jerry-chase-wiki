import { runBuildAttemptCoordinator } from './buildAttemptCoordinator';
import { createBuildReadSummary, type BuildReadSummary } from './buildReadSummary';

function summary(attempt: number): BuildReadSummary {
  return createBuildReadSummary({
    attempt,
    mode: 'enabled',
    sources: [
      {
        source: 'approved-actions',
        fetchCount: 1,
        rowCount: 0,
        serializedBytes: 2,
        durationMs: 1,
        checksum: 'a'.repeat(64),
      },
      {
        source: 'character-contributors',
        fetchCount: 1,
        rowCount: 0,
        serializedBytes: 2,
        durationMs: 1,
        checksum: 'b'.repeat(64),
      },
      {
        source: 'synced-history',
        fetchCount: 1,
        rowCount: 0,
        serializedBytes: 2,
        durationMs: 1,
        checksum: 'c'.repeat(64),
      },
    ],
    epochValidation: { checkCount: 2, durationMs: 1 },
  });
}

describe('build attempt coordinator', () => {
  it('retries final-guard drift with a fresh artifact and accepts the stable attempt', async () => {
    const paths: string[] = [];
    const cleaned: Array<string | undefined> = [];
    const finalEpochs = [2, 3];
    const emitted: BuildReadSummary[] = [];

    await runBuildAttemptCoordinator({
      prepareAttempt: async (attempt) => {
        const artifactPath = `artifact-${attempt}`;
        paths.push(artifactPath);
        return { artifactPath, replayEpoch: attempt === 1 ? 1 : 3, summary: summary(attempt) };
      },
      runOutputPipeline: async () => undefined,
      readFinalEpoch: async () => ({ epoch: finalEpochs.shift()!, durationMs: 1 }),
      addFinalEpochMeasurement: (value) => ({
        ...value,
        epochValidation: { checkCount: 3, durationMs: 2 },
      }),
      cleanFailedAttempt: async (artifactPath) => {
        cleaned.push(artifactPath);
      },
      removeAcceptedArtifact: async () => undefined,
      emitSummary: (value) => emitted.push(value),
    });

    expect(paths).toEqual(['artifact-1', 'artifact-2']);
    expect(cleaned).toEqual(['artifact-1']);
    expect(emitted.map(({ attempt }) => attempt)).toEqual([1, 2]);
    expect(emitted.every(({ epochValidation }) => epochValidation.checkCount === 3)).toBe(true);
  });

  it('does not retry an unrelated output failure', async () => {
    const prepareAttempt = jest.fn(async () => ({
      artifactPath: 'artifact-1',
      replayEpoch: 1,
      summary: summary(1),
    }));

    await expect(
      runBuildAttemptCoordinator({
        prepareAttempt,
        runOutputPipeline: async () => {
          throw new Error('typescript_failed');
        },
        readFinalEpoch: async () => ({ epoch: 1, durationMs: 1 }),
        addFinalEpochMeasurement: (value) => value,
        cleanFailedAttempt: async () => undefined,
        removeAcceptedArtifact: async () => undefined,
        emitSummary: () => undefined,
      })
    ).rejects.toThrow('typescript_failed');
    expect(prepareAttempt).toHaveBeenCalledTimes(1);
  });

  it('stops after three drift attempts', async () => {
    const prepareAttempt = jest.fn(async (attempt: number) => ({
      artifactPath: `artifact-${attempt}`,
      replayEpoch: 1,
      summary: summary(attempt),
    }));

    await expect(
      runBuildAttemptCoordinator({
        prepareAttempt,
        runOutputPipeline: async () => undefined,
        readFinalEpoch: async () => ({ epoch: 2, durationMs: 1 }),
        addFinalEpochMeasurement: (value) => value,
        cleanFailedAttempt: async () => undefined,
        removeAcceptedArtifact: async () => undefined,
        emitSummary: () => undefined,
      })
    ).rejects.toThrow('approved_replay_epoch_drift_after_3_attempts');
    expect(prepareAttempt).toHaveBeenCalledTimes(3);
  });
});
