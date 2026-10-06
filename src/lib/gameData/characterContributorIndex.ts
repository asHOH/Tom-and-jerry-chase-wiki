import 'server-only';

import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  buildCharacterContributorIndex,
  filterHiddenCharacterContributors,
  parseCharacterContributorArtifactPayload,
  type CharacterContributorIndex,
} from '@/lib/gameData/characterContributors';
import { queryCharacterContributorSource } from '@/lib/gameData/characterContributorSourceQuery';
import {
  getPublicGameDataDomainCacheTag,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
} from '@/lib/gameData/publicActionsCache';
import { PRODUCTION_BUILD_IDENTITY } from '@/lib/gameData/published/buildIdentity';
import { cached, createCached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';
import { hiddenContributorNicknames } from '@/data/hiddenContributorNicknames';

async function queryRuntimeCharacterContributorIndex(): Promise<CharacterContributorIndex> {
  const client = getOptionalSupabasePublicClient();
  if (!client) return {};
  const source = await queryCharacterContributorSource(client);
  return buildCharacterContributorIndex(source.rows);
}

const readCachedRuntimeCharacterContributorIndex = createCached(
  [
    getPublicGameDataDomainCacheTag('characters'),
    'character-contributor-index',
    'v2',
    ...hiddenContributorNicknames,
  ],
  queryRuntimeCharacterContributorIndex,
  {
    revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
    tags: [getPublicGameDataDomainCacheTag('characters')],
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
    return cached(
      ['build-character-contributors', 'v1', PRODUCTION_BUILD_IDENTITY],
      async () => {
        const artifact = await readBuildGameDataArtifact();
        return filterHiddenCharacterContributors(
          parseCharacterContributorArtifactPayload(artifact.contributors).index
        );
      },
      {
        revalidate: PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
        tags: [getPublicGameDataDomainCacheTag('characters')],
      }
    );
  }
  return readRuntimeCharacterContributorIndex();
}
