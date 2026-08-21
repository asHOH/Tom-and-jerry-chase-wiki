const createCachedMock = jest.fn(
  (_key: unknown, callback: () => Promise<unknown>, _options?: unknown) => callback
);
const rpcMock = jest.fn();
const getPublicClientMock = jest.fn(() => ({ rpc: rpcMock }));
const getArtifactPathMock = jest.fn((): string | undefined => undefined);
const readArtifactMock = jest.fn();

jest.mock('@/lib/serverCache', () => ({
  createCached: (key: unknown, callback: () => Promise<unknown>, options?: unknown) =>
    createCachedMock(key, callback, options),
}));
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));
jest.mock('@/lib/supabase/publicClient', () => ({
  getOptionalSupabasePublicClient: () => getPublicClientMock(),
}));
jest.mock('@/lib/supabase/buildSourceGuard', () => ({
  getBuildGameDataArtifactPath: () => getArtifactPathMock(),
}));
jest.mock('@/lib/gameData/buildArtifactReader', () => ({
  readBuildGameDataArtifact: () => readArtifactMock(),
}));

const contributorId = '11111111-1111-4111-8111-111111111111';
const source = {
  sourceActionCount: 1,
  rowCount: 1,
  rows: [
    {
      characterId: '汤姆',
      contributorId,
      nickname: '贡献者',
      contributionCount: 1,
    },
  ],
};

describe('character contributor index acquisition', () => {
  beforeEach(() => {
    jest.resetModules();
    createCachedMock.mockClear();
    rpcMock.mockReset();
    getPublicClientMock.mockClear();
    getPublicClientMock.mockReturnValue({ rpc: rpcMock });
    getArtifactPathMock.mockReset();
    getArtifactPathMock.mockReturnValue(undefined);
    readArtifactMock.mockReset();
  });

  it('uses one global tagged cache key and one in-flight runtime RPC', async () => {
    let resolveQuery: ((value: { data: unknown; error: null }) => void) | undefined;
    rpcMock.mockReturnValue(
      new Promise((resolve) => {
        resolveQuery = resolve;
      })
    );
    const { getCharacterContributorIndex } = await import('./characterContributorIndex');

    const reads = [
      getCharacterContributorIndex(),
      getCharacterContributorIndex(),
      getCharacterContributorIndex(),
    ];
    expect(rpcMock).toHaveBeenCalledTimes(1);
    resolveQuery?.({ data: source, error: null });

    await expect(Promise.all(reads)).resolves.toEqual([
      { 汤姆: [{ id: contributorId, name: '贡献者', contributionCount: 1 }] },
      { 汤姆: [{ id: contributorId, name: '贡献者', contributionCount: 1 }] },
      { 汤姆: [{ id: contributorId, name: '贡献者', contributionCount: 1 }] },
    ]);
    expect(createCachedMock).toHaveBeenCalledWith(
      ['public-game-data-actions', 'character-contributor-index', 'v1'],
      expect.any(Function),
      {
        revalidate: 60 * 60,
        tags: ['public-game-data-actions'],
      }
    );
  });

  it('clears the in-flight promise after an error so a later read can retry', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'temporary' } });
    const { getCharacterContributorIndex } = await import('./characterContributorIndex');

    await expect(getCharacterContributorIndex()).rejects.toThrow(
      'character_contributor_source_query_failed'
    );

    rpcMock.mockResolvedValueOnce({ data: source, error: null });
    await expect(getCharacterContributorIndex()).resolves.toEqual({
      汤姆: [{ id: contributorId, name: '贡献者', contributionCount: 1 }],
    });
    expect(rpcMock).toHaveBeenCalledTimes(2);
  });

  it('reads the artifact payload without constructing a runtime client', async () => {
    const { createCharacterContributorArtifactPayload, parseCharacterContributorSourcePayload } =
      await import('./characterContributors');
    getArtifactPathMock.mockReturnValue('D:/tmp/attempt-1.json');
    readArtifactMock.mockResolvedValue({
      contributors: createCharacterContributorArtifactPayload(
        parseCharacterContributorSourcePayload(source)
      ),
    });
    const { getCharacterContributorIndex } = await import('./characterContributorIndex');

    await expect(getCharacterContributorIndex()).resolves.toEqual({
      汤姆: [{ id: contributorId, name: '贡献者', contributionCount: 1 }],
    });
    expect(getPublicClientMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
