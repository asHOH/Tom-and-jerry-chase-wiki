const cachedMock = jest.fn(
  async (_key: unknown, callback: () => Promise<unknown>, _options?: unknown) => callback()
);
const readArtifactFileMock = jest.fn(
  async (_artifactPath: string, _deploymentIdentity: string) => ({
    deploymentIdentity: 'deployment-1',
  })
);

jest.mock('@/lib/serverCache', () => ({
  cached: (key: unknown, callback: () => Promise<unknown>, options?: unknown) =>
    cachedMock(key, callback, options),
}));
jest.mock('@/lib/gameData/publicActionsCache', () => ({
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG: 'public-game-data-actions',
}));
jest.mock('./buildArtifactFile', () => ({
  readBuildGameDataArtifactFile: (artifactPath: string, deploymentIdentity: string) =>
    readArtifactFileMock(artifactPath, deploymentIdentity),
}));
jest.mock('./published/buildIdentity', () => ({
  PRODUCTION_BUILD_IDENTITY: 'deployment-1',
}));

describe('build game-data artifact reader', () => {
  const originalArtifactPath = process.env.GAME_DATA_BUILD_ARTIFACT_PATH;

  beforeEach(() => {
    process.env.GAME_DATA_BUILD_ARTIFACT_PATH = 'D:/tmp/attempt-1.json';
  });

  afterAll(() => {
    if (originalArtifactPath === undefined) {
      delete process.env.GAME_DATA_BUILD_ARTIFACT_PATH;
    } else {
      process.env.GAME_DATA_BUILD_ARTIFACT_PATH = originalArtifactPath;
    }
  });

  it('binds the unique path and deployment identity into one tagged cached read', async () => {
    const { readBuildGameDataArtifact } = await import('./buildArtifactReader');

    await expect(readBuildGameDataArtifact()).resolves.toEqual({
      deploymentIdentity: 'deployment-1',
    });
    expect(cachedMock).toHaveBeenCalledWith(
      [
        'public-game-data-actions',
        'build-game-data-artifact',
        'v1',
        'D:/tmp/attempt-1.json',
        'deployment-1',
      ],
      expect.any(Function),
      {
        revalidate: false,
        tags: ['public-game-data-actions'],
      }
    );
    expect(readArtifactFileMock).toHaveBeenCalledWith('D:/tmp/attempt-1.json', 'deployment-1');
  });
});
