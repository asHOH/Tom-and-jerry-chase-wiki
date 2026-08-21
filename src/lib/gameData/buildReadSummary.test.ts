import { createBuildReadSummary, type BuildReadSummaryInput } from './buildReadSummary';

const checksum = 'a'.repeat(64);

function createInput(mode: 'enabled' | 'disabled' = 'enabled'): BuildReadSummaryInput {
  const enabled = mode === 'enabled';
  return {
    attempt: 1,
    mode,
    sources: [
      {
        source: 'approved-actions',
        fetchCount: enabled ? 1 : 0,
        rowCount: enabled ? 675 : 0,
        serializedBytes: enabled ? 1_000_000 : 0,
        durationMs: enabled ? 120 : 0,
        checksum: enabled ? checksum : null,
      },
      {
        source: 'character-contributors',
        fetchCount: enabled ? 1 : 0,
        rowCount: enabled ? 78 : 0,
        serializedBytes: enabled ? 20_000 : 0,
        durationMs: enabled ? 80 : 0,
        checksum: enabled ? checksum : null,
      },
      {
        source: 'synced-history',
        fetchCount: enabled ? 1 : 0,
        rowCount: enabled ? 24 : 0,
        serializedBytes: enabled ? 4_000 : 0,
        durationMs: enabled ? 20 : 0,
        checksum: enabled ? checksum : null,
      },
    ],
    epochValidation: { checkCount: enabled ? 3 : 0, durationMs: enabled ? 12 : 0 },
  };
}

describe('build read summary', () => {
  it.each(['enabled', 'disabled'] as const)('enforces the %s per-attempt budget', (mode) => {
    expect(createBuildReadSummary(createInput(mode))).toMatchObject({
      kind: 'build-game-data-read-summary',
      attempt: 1,
      mode,
    });
  });

  it('rejects duplicate sources and excess fetches', () => {
    const duplicate = createInput();
    duplicate.sources[1] = { ...duplicate.sources[0]! };
    expect(() => createBuildReadSummary(duplicate)).toThrow('invalid_build_read_sources');

    const excess = createInput();
    excess.sources[0]!.fetchCount = 2;
    expect(() => createBuildReadSummary(excess)).toThrow('build_read_budget_exceeded');
  });

  it('projects only privacy-safe fields into the summary', () => {
    const input = createInput() as BuildReadSummaryInput & {
      actionIds?: string[];
      url?: string;
      credential?: string;
    };
    input.actionIds = ['private-action-id'];
    input.url = 'https://example.test/?apikey=secret';
    input.credential = 'service-role-secret';
    Object.assign(input.sources[0]!, { entry: { private: true }, userId: 'private-user-id' });

    const serialized = JSON.stringify(createBuildReadSummary(input));

    expect(serialized).not.toContain('private-action-id');
    expect(serialized).not.toContain('apikey');
    expect(serialized).not.toContain('service-role-secret');
    expect(serialized).not.toContain('private-user-id');
    expect(serialized).not.toContain('entry');
  });
});
