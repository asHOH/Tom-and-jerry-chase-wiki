import 'server-only';

import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActionsCache';
import { cached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';

import { readBuildGameDataArtifactFile } from './buildArtifactFile';
import { BuildGameDataArtifactError } from './buildArtifactSchema';
import { PRODUCTION_BUILD_IDENTITY } from './published/buildIdentity';

export function hasBuildGameDataArtifact(): boolean {
  return getBuildGameDataArtifactPath() !== undefined;
}

/** Shared tagged reader used by every artifact-backed game-data selector. */
export async function readBuildGameDataArtifact() {
  const artifactPath = getBuildGameDataArtifactPath();
  if (!artifactPath) throw new BuildGameDataArtifactError('artifact_invalid');

  return cached(
    [
      PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
      'build-game-data-artifact',
      'v1',
      artifactPath,
      PRODUCTION_BUILD_IDENTITY,
    ],
    () => readBuildGameDataArtifactFile(artifactPath, PRODUCTION_BUILD_IDENTITY),
    {
      revalidate: false,
      tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
    }
  );
}
