import {
  clearActiveEditRuntime,
  installActiveEditRuntime,
  type ActiveEditRuntime,
} from '@/lib/edit/activeEditRuntime';
import { createEditModeRegistry } from '@/lib/edit/editModeRegistry';
import { createEditStores } from '@/lib/edit/editStores';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data/static';

const baseline = {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} as PublishedGameDataByType;

export function installTestEditRuntime(): ActiveEditRuntime {
  const stores = createEditStores(baseline);
  const runtime: ActiveEditRuntime = {
    stores,
    registry: createEditModeRegistry(stores, baseline),
    revision: 'v1:test',
  };

  installActiveEditRuntime(runtime);
  return runtime;
}

export function clearTestEditRuntime(runtime: ActiveEditRuntime): void {
  runtime.registry.teardownSubscribers();
  clearActiveEditRuntime(runtime);
}
