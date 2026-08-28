import { dynamic, GET, revalidate } from './route';

jest.mock('@/lib/gameData/buildArtifactReader', () => ({
  hasBuildGameDataArtifact: () => true,
  readBuildGameDataArtifact: async () => ({
    deploymentIdentity: 'deployment-identity',
    approvedActions: {},
  }),
}));

jest.mock('@/lib/gameData/approvedActionArtifact', () => ({
  parseApprovedActionArtifactPayload: () => ({
    payload: { replayEpoch: 42, rowCount: 3 },
    snapshot: { actionRevision: 'v1:artifact-revision' },
  }),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { headers?: Record<string, string> }) => ({
      json: async () => body,
      headers: {
        get: (name: string) =>
          Object.entries(init?.headers ?? {}).find(
            ([key]) => key.toLowerCase() === name.toLowerCase()
          )?.[1] ?? null,
      },
    }),
  },
}));

describe('version route', () => {
  it('stays static with the project-wide maximum cache lifetime', () => {
    expect(dynamic).toBe('force-static');
    expect(revalidate).toBe(43200);
  });

  it('returns deployment version metadata without allowing browser caching', async () => {
    const response = await GET();
    const body = (await response.json()) as {
      version?: string;
      environment?: string;
      gameDataArtifact?: unknown;
    };

    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(body.version).toBeTruthy();
    expect(body.environment).toBeTruthy();
    expect(body.gameDataArtifact).toEqual({
      deploymentIdentity: 'deployment-identity',
      replayEpoch: 42,
      actionRevision: 'v1:artifact-revision',
      rowCount: 3,
    });
  });
});
