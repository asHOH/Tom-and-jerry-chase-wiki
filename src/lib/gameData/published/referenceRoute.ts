import 'server-only';

import { cache } from 'react';

import type { ReferenceCatalog } from '@/lib/referenceSources';
import type { FactionId, SingleItemTypeName } from '@/data/types';

import {
  projectKnowledgeCardCharacters,
  projectMapModeRelationCharacters,
  projectSpecialSkillCharacters,
} from './clientProjections';
import {
  getReferenceActionSnapshot,
  getReferencePage,
  type PackedReferencePage,
} from './reverseReferences';
import {
  getPublishedEntityRouteReadModel,
  type PublishedEntityRouteReadModel,
} from './routeSelectors';
import type { PublishedGameDataEntityByType } from './types';

const itemTypes = {
  characters: 'character',
  cards: 'knowledgeCard',
  specialSkills: 'specialSkill',
  achievements: 'achievement',
  buffs: 'buff',
  entities: 'entity',
  items: 'item',
  fixtures: 'fixture',
  modes: 'mode',
} as const satisfies Record<string, SingleItemTypeName>;
type Domain = keyof typeof itemTypes;
type Scoped = 'achievements' | 'specialSkills';
type Unscoped = Exclude<Domain, Scoped>;

type RelatedData = {
  cards: { charactersData: ReturnType<typeof projectKnowledgeCardCharacters> };
  specialSkills: { charactersData: ReturnType<typeof projectSpecialSkillCharacters> };
  modes: {
    charactersData: ReturnType<typeof projectMapModeRelationCharacters>;
    mapsData: ReferenceCatalog['maps'];
  };
};
type DetailRead<D extends Domain> = Omit<PublishedEntityRouteReadModel<D>, 'data'> & {
  data: PublishedGameDataEntityByType[D];
  referencePage: PackedReferencePage;
} & (D extends keyof RelatedData ? RelatedData[D] : unknown);

function relatedData(type: Domain, catalog: ReferenceCatalog) {
  if (type === 'cards')
    return { charactersData: projectKnowledgeCardCharacters(catalog.characters) };
  if (type === 'specialSkills')
    return { charactersData: projectSpecialSkillCharacters(catalog.characters) };
  if (type === 'modes')
    return {
      mapsData: catalog.maps,
      charactersData: projectMapModeRelationCharacters(catalog.characters),
    };
  return {};
}

function readReferenceRoute<D extends Unscoped>(type: D, id: string): Promise<DetailRead<D> | null>;
function readReferenceRoute<D extends Scoped>(
  type: D,
  id: string,
  faction: FactionId
): Promise<DetailRead<D> | null>;
async function readReferenceRoute(
  ...args: [Unscoped, string] | [Scoped, string, FactionId]
): Promise<DetailRead<Domain> | null> {
  const [type, id, factionId] = args;
  const snapshot = await getReferenceActionSnapshot();
  const entity =
    args.length === 3
      ? await getPublishedEntityRouteReadModel(args[0], id, args[2], snapshot)
      : await getPublishedEntityRouteReadModel(args[0], id, undefined, snapshot);
  const record = entity.data;
  if (!record) return null;
  const root = {
    type: itemTypes[type],
    name: 'id' in record ? record.id : record.name,
    sourceId: entity.entityId,
    ...(factionId ? { factionId } : {}),
  };
  const targets =
    type === 'characters'
      ? [
          root,
          ...(record as PublishedGameDataEntityByType['characters']).skills.map((skill, index) => ({
            type: 'skill' as const,
            name: skill.name,
            skillLocation: { characterId: entity.entityId, index },
          })),
        ]
      : [root];
  const { page, data } = await getReferencePage(snapshot, type, targets);
  return { ...entity, data: record, referencePage: page, ...relatedData(type, data) };
}

// Reuse the entity reader's metadata/history work and keep every client prop on the same snapshot.
export const getPublishedReferenceRoute = cache(readReferenceRoute);
