import type { Route } from 'next';

import type { FactionId } from '@/data/types';

import { flattenActionEntries, normalizePublicActionEntries } from './actionEntries';
import { getGameDataActionTarget } from './scopedEntityPaths';

export type AffectedGameDataName = {
  name: string;
  factionId?: FactionId;
};

const GAME_DATA_ROUTES: Record<string, string> = {
  achievements: '/achievements',
  buffs: '/buffs',
  cards: '/cards',
  characters: '/characters',
  entities: '/entities',
  fixtures: '/fixtures',
  items: '/items',
  maps: '/maps',
  modes: '/modes',
  specialSkills: '/special-skills',
};

export const GAME_DATA_ENTITY_LABELS: Record<string, string> = {
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
};

export function getAffectedGameDataNames(
  entityType: string,
  rawEntry: unknown
): AffectedGameDataName[] {
  const entries = normalizePublicActionEntries(rawEntry);
  const names = new Map<string, AffectedGameDataName>();

  for (const action of flattenActionEntries(entries)) {
    const target = getGameDataActionTarget(entityType, action.path);
    if (!target) continue;

    const key = target.factionId ? `${target.factionId}:${target.entityId}` : target.entityId;
    if (!names.has(key)) {
      names.set(key, {
        name: target.entityId,
        ...(target.factionId && { factionId: target.factionId }),
      });
    }
  }

  return [...names.values()];
}

export function getGameDataDetailHref(
  entityType: string,
  target: AffectedGameDataName | undefined
): Route | null {
  const route = GAME_DATA_ROUTES[entityType];
  if (!route || !target) return null;

  if (target.factionId) {
    return `${route}/${encodeURIComponent(target.factionId)}/${encodeURIComponent(target.name)}` as Route;
  }

  return `${route}/${encodeURIComponent(target.name)}` as Route;
}

export type GameDataNotificationEntity = {
  entityType: string;
  entityTypeLabel: string;
  entityName: string;
  entityUrl: Route | null;
};

export function getGameDataNotificationEntities(
  entityType: string,
  rawEntry: unknown
): GameDataNotificationEntity[] {
  return getAffectedGameDataNames(entityType, rawEntry).map((target) => ({
    entityType,
    entityTypeLabel: GAME_DATA_ENTITY_LABELS[entityType] ?? entityType,
    entityName: target.name,
    entityUrl: getGameDataDetailHref(entityType, target),
  }));
}

export function getGameDataNotificationDetails(
  records: readonly { entity_type: string; entry: unknown }[]
): { summary: string; href: string | null } {
  const entities = records.flatMap((record) =>
    getGameDataNotificationEntities(record.entity_type, record.entry)
  );
  const uniqueEntities = [
    ...new Map(
      entities.map((entity) => [
        `${entity.entityType}:${entity.entityName}:${entity.entityUrl ?? ''}`,
        entity,
      ])
    ).values(),
  ];

  const summary = uniqueEntities.length
    ? `${uniqueEntities
        .slice(0, 3)
        .map((entity) => `${entity.entityTypeLabel}「${entity.entityName}」`)
        .join('、')}${uniqueEntities.length > 3 ? ` 等 ${uniqueEntities.length} 项` : ''}`
    : [
        ...new Set(
          records.map((record) => GAME_DATA_ENTITY_LABELS[record.entity_type] ?? record.entity_type)
        ),
      ].join('、') || '游戏数据';

  return {
    summary,
    href: uniqueEntities.find((entity) => entity.entityUrl)?.entityUrl ?? null,
  };
}
