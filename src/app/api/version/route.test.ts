import { dynamic, GET, revalidate } from './route';

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
  afterEach(() => jest.restoreAllMocks());

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
    expect(body.gameDataArtifact).toBeNull();
  });

  it('returns the embedded snapshot when loaded at runtime without the build artifact', async () => {
    const metadata = {
      deploymentIdentity: 'deployment-identity',
      replayEpoch: 42,
      actionRevision: 'v1:artifact-revision',
      rowCount: 3,
    };
    jest.replaceProperty(process, 'env', {
      ...process.env,
      GAME_DATA_BUILD_ARTIFACT_PATH: undefined,
      TJWIKI_GAME_DATA_ARTIFACT_METADATA: JSON.stringify(metadata),
    });

    await jest.isolateModulesAsync(async () => {
      const { GET: runtimeGET } = await import('./route');
      expect(await (await runtimeGET()).json()).toMatchObject({ gameDataArtifact: metadata });
    });
  });
});
