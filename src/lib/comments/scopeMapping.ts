import 'server-only';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import type { FactionId } from '@/data/types';

type DiscussionEntityConfig = Readonly<{
  entityType: PublishableEntityType;
  scope: string;
  label: string;
  factionScoped?: boolean;
}>;

const DISCUSSION_ENTITY_CONFIGS = {
  entities: { entityType: 'entities', scope: 'entities', label: '衍生物' },
  items: { entityType: 'items', scope: 'items', label: '道具' },
  buffs: { entityType: 'buffs', scope: 'buffs', label: '状态' },
  maps: { entityType: 'maps', scope: 'maps', label: '地图' },
  fixtures: { entityType: 'fixtures', scope: 'fixtures', label: '组件' },
  modes: { entityType: 'modes', scope: 'modes', label: '模式' },
  achievements: {
    entityType: 'achievements',
    scope: 'achievements',
    label: '对局成就',
    factionScoped: true,
  },
  cards: { entityType: 'cards', scope: 'knowledge_cards', label: '知识卡' },
  'special-skills': {
    entityType: 'specialSkills',
    scope: 'special_skills',
    label: '特技',
    factionScoped: true,
  },
  characters: { entityType: 'characters', scope: 'characters', label: '角色' },
} as const satisfies Record<string, DiscussionEntityConfig>;

type DiscussionRouteSegment = keyof typeof DISCUSSION_ENTITY_CONFIGS;

type DiscussionEntityAddress = Readonly<{
  entityId: string;
  targetId: string;
  factionId?: FactionId;
}>;

export type DiscussionTarget = Readonly<{
  metadataTitle: string;
  scope: string;
  targetId: string;
  entityTitle: string;
  entityTypeLabel: string;
  parentUrl: string;
}>;

export type DiscussionNotificationTarget = Readonly<{
  entityTitle: string;
  entityTypeLabel: string;
  href: string;
}>;

function getDiscussionConfig(routeSegment: string): DiscussionEntityConfig | null {
  if (!Object.prototype.hasOwnProperty.call(DISCUSSION_ENTITY_CONFIGS, routeSegment)) return null;
  return DISCUSSION_ENTITY_CONFIGS[routeSegment as DiscussionRouteSegment];
}

function getDiscussionConfigByScope(
  scope: string
): { routeSegment: DiscussionRouteSegment; config: DiscussionEntityConfig } | null {
  for (const [routeSegment, config] of Object.entries(DISCUSSION_ENTITY_CONFIGS)) {
    if (config.scope === scope) {
      return { routeSegment: routeSegment as DiscussionRouteSegment, config };
    }
  }
  return null;
}

function isFactionId(value: string | undefined): value is FactionId {
  return value === 'cat' || value === 'mouse';
}

function createEntityAddress(
  config: DiscussionEntityConfig,
  entityPathSegments: readonly string[]
): DiscussionEntityAddress | null {
  if (config.factionScoped) {
    const factionId = entityPathSegments[0];
    const entityId = entityPathSegments.slice(1).join('/').trim();
    if (!isFactionId(factionId) || !entityId) return null;
    return { factionId, entityId, targetId: `${factionId}.${entityId}` };
  }

  const entityId = entityPathSegments.join('/').trim();
  return entityId ? { entityId, targetId: entityId } : null;
}

function createEntityAddressFromTargetId(
  config: DiscussionEntityConfig,
  targetId: string
): DiscussionEntityAddress | null {
  const normalizedTargetId = targetId.trim();
  if (!normalizedTargetId) return null;
  if (!config.factionScoped) {
    return { entityId: normalizedTargetId, targetId: normalizedTargetId };
  }

  const separatorIndex = normalizedTargetId.search(/[./]/);
  if (separatorIndex <= 0) return null;
  const factionId = normalizedTargetId.slice(0, separatorIndex);
  const entityId = normalizedTargetId.slice(separatorIndex + 1).trim();
  if (!isFactionId(factionId) || !entityId) return null;
  return { factionId, entityId, targetId: `${factionId}.${entityId}` };
}

function getEntityTitle(entityType: PublishableEntityType, entity: unknown): string | null {
  if (!entity || typeof entity !== 'object') return null;
  const titleKey = entityType === 'characters' || entityType === 'cards' ? 'id' : 'name';
  const title = (entity as Record<string, unknown>)[titleKey];
  return typeof title === 'string' && title.trim() ? title : null;
}

async function readPublishedEntityTitle(
  config: DiscussionEntityConfig,
  address: DiscussionEntityAddress
): Promise<string | null> {
  const { getPublishedDomainReadModel } =
    await import('@/lib/gameData/published/publishedSnapshot');
  const domain = await getPublishedDomainReadModel(config.entityType);
  let entity: unknown;

  if (address.factionId) {
    const factionRoot = domain.data as unknown as Readonly<
      Record<FactionId, Readonly<Record<string, unknown>>>
    >;
    entity = factionRoot[address.factionId]?.[address.entityId];
  } else {
    const entityRoot = domain.data as unknown as Readonly<Record<string, unknown>>;
    entity = entityRoot[address.entityId];
  }

  return getEntityTitle(config.entityType, entity);
}

function getEntityParentUrl(
  routeSegment: DiscussionRouteSegment,
  address: DiscussionEntityAddress
): string {
  const encodedEntityId = encodeURIComponent(address.entityId);
  return address.factionId
    ? `/${routeSegment}/${address.factionId}/${encodedEntityId}/`
    : `/${routeSegment}/${encodedEntityId}/`;
}

function getDiscussionHref(
  routeSegment: DiscussionRouteSegment,
  address?: DiscussionEntityAddress
): string {
  if (!address) return `/discuss/${encodeURIComponent(routeSegment)}/`;
  const encodedEntityId = encodeURIComponent(address.entityId);
  return address.factionId
    ? `/discuss/${encodeURIComponent(routeSegment)}/${address.factionId}/${encodedEntityId}/`
    : `/discuss/${encodeURIComponent(routeSegment)}/${encodedEntityId}/`;
}

/** Resolves one catch-all discussion route against the current published game-data snapshot. */
export async function resolveDiscussionTarget(
  segments: readonly string[]
): Promise<DiscussionTarget | null> {
  const routeSegment = segments[0];
  if (!routeSegment) return null;
  const config = getDiscussionConfig(routeSegment);
  if (!config) return null;

  if (segments.length === 1) {
    return {
      metadataTitle: `${config.label} - 讨论`,
      scope: 'list_pages',
      targetId: routeSegment,
      entityTitle: config.label,
      entityTypeLabel: config.label,
      parentUrl: `/${routeSegment}/`,
    };
  }

  const address = createEntityAddress(config, segments.slice(1));
  if (!address) return null;
  const entityTitle = await readPublishedEntityTitle(config, address);
  if (!entityTitle) return null;

  return {
    metadataTitle: `${entityTitle} (${config.label}) - 讨论`,
    scope: config.scope,
    targetId: address.targetId,
    entityTitle,
    entityTypeLabel: config.label,
    parentUrl: getEntityParentUrl(routeSegment as DiscussionRouteSegment, address),
  };
}

/** Resolves labels and links for a stored discussion comment target. */
export async function resolveDiscussionNotificationTarget(
  scope: string,
  targetId: string
): Promise<DiscussionNotificationTarget> {
  if (scope === 'list_pages') {
    const config = getDiscussionConfig(targetId);
    const entityTypeLabel = config?.label ?? targetId;
    return {
      entityTitle: entityTypeLabel,
      entityTypeLabel,
      href: config
        ? getDiscussionHref(targetId as DiscussionRouteSegment)
        : `/discuss/${encodeURIComponent(targetId)}/`,
    };
  }

  const matchedConfig = getDiscussionConfigByScope(scope);
  if (!matchedConfig) {
    return {
      entityTitle: targetId,
      entityTypeLabel: scope,
      href: `/discuss/${encodeURIComponent(scope)}/${encodeURIComponent(targetId)}/`,
    };
  }

  const { routeSegment, config } = matchedConfig;
  const address = createEntityAddressFromTargetId(config, targetId);
  const entityTitle = address ? await readPublishedEntityTitle(config, address) : null;

  return {
    entityTitle: entityTitle ?? targetId,
    entityTypeLabel: config.label,
    href: address
      ? getDiscussionHref(routeSegment, address)
      : `/discuss/${encodeURIComponent(routeSegment)}/${encodeURIComponent(targetId)}/`,
  };
}

export function getDiscussionCommentHref(
  scope: string,
  targetId: string,
  commentId: string
): string {
  if (scope === 'list_pages') {
    const config = getDiscussionConfig(targetId);
    const href = config
      ? getDiscussionHref(targetId as DiscussionRouteSegment)
      : `/discuss/${encodeURIComponent(targetId)}/`;
    return `${href}#comment-${commentId}`;
  }

  const matchedConfig = getDiscussionConfigByScope(scope);
  if (!matchedConfig) {
    return `/discuss/${encodeURIComponent(scope)}/${encodeURIComponent(targetId)}/#comment-${commentId}`;
  }

  const address = createEntityAddressFromTargetId(matchedConfig.config, targetId);
  const href = address
    ? getDiscussionHref(matchedConfig.routeSegment, address)
    : `/discuss/${encodeURIComponent(matchedConfig.routeSegment)}/${encodeURIComponent(targetId)}/`;
  return `${href}#comment-${commentId}`;
}
