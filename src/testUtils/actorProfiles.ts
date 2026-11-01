import type { ActorProfile } from '@/features/actor-profiles/schema';

// Synthetic statistics keep behavior tests independent of game balance updates.
export const createActorProfileFixture = (overrides: Partial<ActorProfile> = {}): ActorProfile => ({
  name: '测试角色',
  actorType: 'mouse',
  physicsType: 'mouse',
  sex: 'male',
  size: { width: 80, height: 120 },
  runSpeed: 700,
  jumpSpeed: 20,
  climbSpeed: 200,
  visionScale: 0.8,
  gravity: -2,
  baseHp: 120,
  maxHp: 120,
  hpRecovery: 3,
  attack: 0,
  wallDamage: 1,
  attackCooldown: { hit: 4, miss: 2 },
  pushCheeseSpeed: 3.5,
  ...overrides,
});
