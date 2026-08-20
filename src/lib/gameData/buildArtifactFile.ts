import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  BuildGameDataArtifactError,
  parseBuildGameDataArtifact,
  type BuildGameDataArtifact,
} from './buildArtifactSchema';

export async function readBuildGameDataArtifactFile(
  artifactPath: string,
  expectedDeploymentIdentity: string
): Promise<BuildGameDataArtifact> {
  if (!path.isAbsolute(artifactPath)) {
    throw new BuildGameDataArtifactError('artifact_invalid');
  }

  let contents: string;
  try {
    contents = await readFile(artifactPath, 'utf8');
  } catch (error) {
    throw new BuildGameDataArtifactError('artifact_invalid', { cause: error });
  }

  let value: unknown;
  try {
    value = JSON.parse(contents);
  } catch (error) {
    throw new BuildGameDataArtifactError('artifact_invalid', { cause: error });
  }
  return parseBuildGameDataArtifact(value, expectedDeploymentIdentity);
}

export async function writeBuildGameDataArtifactFile(
  artifactPath: string,
  artifact: BuildGameDataArtifact
): Promise<void> {
  if (!path.isAbsolute(artifactPath)) {
    throw new BuildGameDataArtifactError('artifact_invalid');
  }
  parseBuildGameDataArtifact(artifact, artifact.deploymentIdentity);

  const directory = path.dirname(artifactPath);
  const temporaryPath = path.join(directory, `.${path.basename(artifactPath)}.${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporaryPath, `${JSON.stringify(artifact)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporaryPath, artifactPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function removeBuildGameDataArtifactFile(artifactPath: string): Promise<void> {
  if (!path.isAbsolute(artifactPath)) {
    throw new BuildGameDataArtifactError('artifact_invalid');
  }
  await rm(artifactPath, { force: true });
}
