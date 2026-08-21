import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { readBuildGameDataArtifact } from '@/lib/gameData/buildArtifactReader';
import {
  buildCharacterContributorIndex,
  parseCharacterContributorArtifactPayload,
  parseCharacterContributorSourcePayload,
  type CharacterContributorIndex,
  type CharacterContributorSourcePayload,
} from '@/lib/gameData/characterContributors';
import {
  PUBLIC_GAME_DATA_ACTIONS_CACHE_REVALIDATE_SECONDS,
  PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG,
} from '@/lib/gameData/publicActionsCache';
import { createCached } from '@/lib/serverCache';
import { getBuildGameDataArtifactPath } from '@/lib/supabase/buildSourceGuard';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';
import type { Database } from '@/data/database.types';

export async function queryCharacterContributorSource(
  client: SupabaseClient<Database>
): Promise<CharacterContributorSourcePayload> {
  const { data, error } = await client.rpc('read_game_data_character_contributor_source');
  if (error) throw new Error('character_contributor_source_query_failed', { cause: error });
  return parseCharacterContributorSourcePayload(data);
}

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
