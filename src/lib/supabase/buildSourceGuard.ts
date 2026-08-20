const BUILD_ARTIFACT_ENV_NAME = 'GAME_DATA_BUILD_ARTIFACT_PATH';

export type BuildGameDataSource = 'approved-actions' | 'character-contributors';

export class BuildSourceQueryBlockedError extends Error {
  readonly code = 'build_source_query_blocked';

  constructor(public readonly source: BuildGameDataSource) {
    super(`A Next.js build worker attempted the guarded ${source} source query`);
    this.name = 'BuildSourceQueryBlockedError';
  }
}

export function getBuildGameDataArtifactPath(): string | undefined {
  const value = process.env[BUILD_ARTIFACT_ENV_NAME]?.trim();
  return value || undefined;
}

function getRequestUrl(input: RequestInfo | URL): URL | undefined {
  try {
    if (input instanceof URL) return input;
    if (typeof input === 'string') return new URL(input);
    return new URL(input.url);
  } catch {
    return undefined;
  }
}

function identifyGuardedSource(pathname: string): BuildGameDataSource | undefined {
  const normalizedPath = pathname.replace(/\/+$/, '');
  if (normalizedPath.endsWith('/rest/v1/game_data_actions')) {
    return 'approved-actions';
  }
  if (normalizedPath.endsWith('/rest/v1/rpc/read_game_data_character_contributor_source')) {
    return 'character-contributors';
  }
  return undefined;
}

/** Rejects build-worker reads of the two bulk game-data sources before network I/O. */
export function assertBuildSourceQueryAllowed(input: RequestInfo | URL): void {
  if (!getBuildGameDataArtifactPath()) return;

  const source = getRequestUrl(input);
  const guardedSource = source ? identifyGuardedSource(source.pathname) : undefined;
  if (guardedSource) throw new BuildSourceQueryBlockedError(guardedSource);
}
