import {
  clearActiveEditRuntime,
  installActiveEditRuntime,
  type ActiveEditRuntime,
} from '@/lib/edit/activeEditRuntime';
import { createEditSession } from '@/lib/edit/editSession';
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
  traits,
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
  traits,
} as PublishedGameDataByType;

export function installTestEditRuntime(): ActiveEditRuntime {
  const runtime = createEditSession(baseline, 'v1:test');
  runtime.registry.teardownSubscribers();

  installActiveEditRuntime(runtime);
  return runtime;
}

export function clearTestEditRuntime(runtime: ActiveEditRuntime): void {
  runtime.dispose();
  clearActiveEditRuntime(runtime);
}
