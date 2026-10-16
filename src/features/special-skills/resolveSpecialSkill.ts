import type { DeepReadonly } from '@/types/deep-readonly';
import type { FactionId, SpecialSkill } from '@/data/types';

// Shared names require a faction; an explicit faction never falls back to the other one.
export function resolveSpecialSkill(
  skills: DeepReadonly<Record<FactionId, Record<string, SpecialSkill>>>,
  name: string,
  factionId?: FactionId
): DeepReadonly<SpecialSkill> | undefined {
  const cat = Object.hasOwn(skills.cat, name) ? skills.cat[name] : undefined;
  const mouse = Object.hasOwn(skills.mouse, name) ? skills.mouse[name] : undefined;
  if (factionId === 'cat') return cat;
  if (factionId === 'mouse') return mouse;
  if (factionId !== undefined || (cat && mouse)) return undefined;
  return cat ?? mouse;
}
