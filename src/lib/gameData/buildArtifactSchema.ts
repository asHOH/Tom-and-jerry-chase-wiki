export const BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION = 1 as const;

export type BuildGameDataArtifact = {
  schemaVersion: typeof BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION;
  deploymentIdentity: string;
  fetchedAt: string;
  approvedActions: unknown;
  contributors: unknown;
};

export type BuildGameDataArtifactErrorCode =
  'artifact_invalid' | 'artifact_schema_mismatch' | 'artifact_deployment_mismatch';

export class BuildGameDataArtifactError extends Error {
  constructor(
    public readonly code: BuildGameDataArtifactErrorCode,
    options?: ErrorOptions
  ) {
    super(code, options);
    this.name = 'BuildGameDataArtifactError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value));
}

/** Validates the shared envelope; source-specific readers validate their own payloads. */
export function parseBuildGameDataArtifact(
  value: unknown,
  expectedDeploymentIdentity: string
): BuildGameDataArtifact {
  if (!isRecord(value)) throw new BuildGameDataArtifactError('artifact_invalid');
  if (value.schemaVersion !== BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION) {
    throw new BuildGameDataArtifactError('artifact_schema_mismatch');
  }
  if (
    typeof value.deploymentIdentity !== 'string' ||
    value.deploymentIdentity.length === 0 ||
    !isIsoTimestamp(value.fetchedAt) ||
    !isRecord(value.approvedActions) ||
    !isRecord(value.contributors)
  ) {
    throw new BuildGameDataArtifactError('artifact_invalid');
  }
  if (value.deploymentIdentity !== expectedDeploymentIdentity) {
    throw new BuildGameDataArtifactError('artifact_deployment_mismatch');
  }

  return {
    schemaVersion: BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
    deploymentIdentity: value.deploymentIdentity,
    fetchedAt: value.fetchedAt,
    approvedActions: value.approvedActions,
    contributors: value.contributors,
  };
}
