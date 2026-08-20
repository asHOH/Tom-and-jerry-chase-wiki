import {
  BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
  BuildGameDataArtifactError,
  parseBuildGameDataArtifact,
  type BuildGameDataArtifactErrorCode,
} from './buildArtifactSchema';

const validArtifact = {
  schemaVersion: BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
  deploymentIdentity: 'deployment-1',
  fetchedAt: '2026-08-21T00:00:00.000Z',
  approvedActions: { rows: [] },
  contributors: { index: {} },
};

describe('build game-data artifact schema', () => {
  it('accepts the shared envelope without interpreting source payloads', () => {
    expect(parseBuildGameDataArtifact(validArtifact, 'deployment-1')).toEqual(validArtifact);
  });

  it.each<{
    artifact: unknown;
    code: BuildGameDataArtifactErrorCode;
    identity?: string;
  }>([
    { artifact: { ...validArtifact, schemaVersion: 2 }, code: 'artifact_schema_mismatch' },
    { artifact: { ...validArtifact, deploymentIdentity: '' }, code: 'artifact_invalid' },
    { artifact: { ...validArtifact, fetchedAt: 'not-a-date' }, code: 'artifact_invalid' },
    { artifact: { ...validArtifact, approvedActions: [] }, code: 'artifact_invalid' },
    { artifact: { ...validArtifact, contributors: null }, code: 'artifact_invalid' },
    {
      artifact: validArtifact,
      code: 'artifact_deployment_mismatch',
      identity: 'deployment-2',
    },
  ])('rejects an invalid or stale envelope', ({ artifact, code, identity = 'deployment-1' }) => {
    expect(() => parseBuildGameDataArtifact(artifact, identity)).toThrow(
      expect.objectContaining<Partial<BuildGameDataArtifactError>>({ code })
    );
  });
});
