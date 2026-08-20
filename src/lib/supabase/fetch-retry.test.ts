import { BuildSourceQueryBlockedError } from './buildSourceGuard';
import { fetchWithRetry } from './fetch-retry';

const BUILD_ARTIFACT_ENV_NAME = 'GAME_DATA_BUILD_ARTIFACT_PATH';

describe('fetchWithRetry build-source guard', () => {
  const originalArtifactPath = process.env[BUILD_ARTIFACT_ENV_NAME];
  const originalFetch = globalThis.fetch;

  function installFetchMock(response?: Response) {
    const networkFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
    if (response) networkFetch.mockResolvedValue(response);
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: networkFetch,
    });
    return networkFetch;
  }

  afterEach(() => {
    if (originalArtifactPath === undefined) {
      delete process.env[BUILD_ARTIFACT_ENV_NAME];
    } else {
      process.env[BUILD_ARTIFACT_ENV_NAME] = originalArtifactPath;
    }
    if (originalFetch === undefined) {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    } else {
      globalThis.fetch = originalFetch;
    }
  });

  it.each([
    ['approved-actions', 'https://project.supabase.co/rest/v1/game_data_actions?select=id%2Centry'],
    [
      'character-contributors',
      new URL(
        'https://project.supabase.co/rest/v1/rpc/read_game_data_character_contributor_source'
      ),
    ],
  ] as const)('blocks the %s source before network access', async (source, input) => {
    process.env[BUILD_ARTIFACT_ENV_NAME] = 'D:/tmp/attempt-1.json';
    const networkFetch = installFetchMock();

    await expect(fetchWithRetry(input)).rejects.toEqual(
      expect.objectContaining<Partial<BuildSourceQueryBlockedError>>({
        code: 'build_source_query_blocked',
        source,
      })
    );
    expect(networkFetch).not.toHaveBeenCalled();
  });

  it('allows unrelated Supabase requests during an artifact-backed build', async () => {
    process.env[BUILD_ARTIFACT_ENV_NAME] = 'D:/tmp/attempt-1.json';
    const response = { ok: true } as Response;
    const networkFetch = installFetchMock(response);

    await expect(fetchWithRetry('https://project.supabase.co/auth/v1/user')).resolves.toBe(
      response
    );
    expect(networkFetch).toHaveBeenCalledTimes(1);
  });

  it('does not guard normal runtime requests when the artifact variable is absent', async () => {
    delete process.env[BUILD_ARTIFACT_ENV_NAME];
    const response = { ok: true } as Response;
    const networkFetch = installFetchMock(response);

    await expect(
      fetchWithRetry('https://project.supabase.co/rest/v1/game_data_actions?select=id')
    ).resolves.toBe(response);
    expect(networkFetch).toHaveBeenCalledTimes(1);
  });
});
