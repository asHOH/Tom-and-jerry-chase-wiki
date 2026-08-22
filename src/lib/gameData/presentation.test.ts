import { getGameDataEntityLabel } from './presentation';
import { PUBLISHABLE_ENTITY_TYPES } from './publishableEntityTypes';

describe('getGameDataEntityLabel', () => {
  it.each([
    ['achievements', '成就'],
    ['buffs', '状态'],
    ['cards', '知识卡'],
    ['characters', '角色'],
    ['entities', '衍生物'],
    ['fixtures', '地图组件'],
    ['items', '道具'],
    ['maps', '地图'],
    ['modes', '游戏模式'],
    ['specialSkills', '特技'],
    ['traits', '特性'],
  ] satisfies ReadonlyArray<[string, string]>)(
    '%s uses its canonical label',
    (entityType, label) => {
      expect(getGameDataEntityLabel(entityType)).toBe(label);
    }
  );

  it('covers every publishable entity type', () => {
    expect(PUBLISHABLE_ENTITY_TYPES).toHaveLength(11);
    for (const entityType of PUBLISHABLE_ENTITY_TYPES) {
      expect(getGameDataEntityLabel(entityType)).not.toBe(entityType);
    }
  });

  it('uses the raw unknown value by default and supports a caller-specific fallback', () => {
    expect(getGameDataEntityLabel('legacyEntity')).toBe('legacyEntity');
    expect(getGameDataEntityLabel('legacyEntity', '游戏数据')).toBe('游戏数据');
  });
});
