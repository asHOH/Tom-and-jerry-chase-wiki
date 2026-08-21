import 'server-only';

import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  buildCharacterContributorIndex,
  parseCharacterContributorArtifactPayload,
  type CharacterContributorIndex,
} from '@/lib/gameData/characterContributors';
import { queryCharacterContributorSource } from '@/lib/gameData/characterContributorSourceQuery';
import {
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import { createCached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';

export { queryCharacterContributorSource } from '@/lib/gameData/characterContributorSourceQuery';

async function queryRuntimeCharacterContributorIndex(): Promise<CharacterContributorIndex> {
  const client = getOptionalSupabasePublicClient();
  if (!client) return {};
  const source = await queryCharacterContributorSource(client);
  return buildCharacterContributorIndex(source.rows);
}

const readCachedRuntimeCharacterContributorIndex = createCached(
  [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'character-contributor-index', 'v1'],
  queryRuntimeCharacterContributorIndex,
  {
    revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
    tags: [PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG],
  }
);

let runtimeAcquisition: Promise<CharacterContributorIndex> | undefined;

function readRuntimeCharacterContributorIndex(): Promise<CharacterContributorIndex> {
  if (runtimeAcquisition) return runtimeAcquisition;

  const acquisition = readCachedRuntimeCharacterContributorIndex();
  runtimeAcquisition = acquisition;
  void acquisition.then(
    () => {
      if (runtimeAcquisition === acquisition) runtimeAcquisition = undefined;
    },
    () => {
      if (runtimeAcquisition === acquisition) runtimeAcquisition = undefined;
    }
  );
  return acquisition;
}

export async function getCharacterContributorIndex(): Promise<CharacterContributorIndex> {
  if (getBuildGameDataArtifactPath()) {
    const artifact = await readBuildGameDataArtifact();
    return parseCharacterContributorArtifactPayload(artifact.contributors).index;
  }
  return readRuntimeCharacterContributorIndex();
}
