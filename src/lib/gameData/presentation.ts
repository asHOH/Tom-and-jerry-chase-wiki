import {
  isPublishableEntityType,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';

const GAME_DATA_ENTITY_LABELS_BY_TYPE = {
  achievements: '成就',
  buffs: '状态',
  cards: '知识卡',
  characters: '角色',
  entities: '衍生物',
  fixtures: '地图组件',
  items: '道具',
  maps: '地图',
  modes: '游戏模式',
  specialSkills: '特技',
  traits: '特性',
} satisfies Record<PublishableEntityType, string>;

/** Returns the canonical label, or the caller's policy for unknown database values. */
export function getGameDataEntityLabel(entityType: string, fallback = entityType): string {
  return isPublishableEntityType(entityType)
    ? GAME_DATA_ENTITY_LABELS_BY_TYPE[entityType]
    : fallback;
}
