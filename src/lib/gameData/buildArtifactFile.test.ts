/** @jest-environment node */

import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  readBuildGameDataArtifactFile,
  removeBuildGameDataArtifactFile,
  writeBuildGameDataArtifactFile,
} from './buildArtifactFile';
import { BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION } from './buildArtifactSchema';

describe('build game-data artifact file', () => {
  let temporaryDirectory: string;

  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'tjwiki-build-artifact-'));
  });

  afterEach(async () => {
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('writes atomically, reads by deployment identity, and leaves no temporary file', async () => {
    const artifactPath = path.join(temporaryDirectory, 'attempt-1.json');
    const artifact = {
      schemaVersion: BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
      deploymentIdentity: 'deployment-1',
      fetchedAt: '2026-08-21T00:00:00.000Z',
      approvedActions: { rows: [] },
      contributors: { index: {} },
    };

    await writeBuildGameDataArtifactFile(artifactPath, artifact);

    await expect(readBuildGameDataArtifactFile(artifactPath, 'deployment-1')).resolves.toEqual(
      artifact
    );
    await expect(readdir(temporaryDirectory)).resolves.toEqual(['attempt-1.json']);

    await removeBuildGameDataArtifactFile(artifactPath);
    await expect(readdir(temporaryDirectory)).resolves.toEqual([]);
  });

  it('rejects relative paths and a mismatched deployment identity', async () => {
    await expect(
      readBuildGameDataArtifactFile('attempt-1.json', 'deployment-1')
    ).rejects.toMatchObject({ code: 'artifact_invalid' });

    const artifactPath = path.join(temporaryDirectory, 'attempt-1.json');
    await writeBuildGameDataArtifactFile(artifactPath, {
      schemaVersion: BUILD_GAME_DATA_ARTIFACT_SCHEMA_VERSION,
      deploymentIdentity: 'deployment-1',
      fetchedAt: '2026-08-21T00:00:00.000Z',
      approvedActions: {},
      contributors: {},
    });
    await expect(readBuildGameDataArtifactFile(artifactPath, 'deployment-2')).rejects.toMatchObject(
      {
        code: 'artifact_deployment_mismatch',
      }
    );
  });
});
