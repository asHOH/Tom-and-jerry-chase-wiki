import type { DeepReadonly } from '@/types/deep-readonly';
import { FACTION_FULL_NAMES } from '@/constants/factions';
import {
  getPositioningTagLevel,
  isPositioningTagVisible,
  sortPositioningTags,
} from '@/constants/positioningTagSequences';
import type { Character, SkillType } from '@/data/types';
import { ACTOR_ATTRIBUTE_PRESENTATION } from '@/features/actor-profiles/attributePresentation';
import {
  formatActorPhysicsBodyName,
  formatActorPhysicsType,
  formatActorSex,
  formatActorType,
} from '@/features/actor-profiles/formatters';
import { getOptionalActorProfile } from '@/features/actor-profiles/selectors';
import { RANKABLE_PROPERTIES, type RankableProperty } from '@/features/characters/utils/ranking';

const skillName = (character: DeepReadonly<Character>, type: SkillType) =>
  character.skills.find((skill) => skill.type === type)?.name;

export const TEXT_TABLE_PROPERTIES = [
  {
    key: 'faction',
    label: '阵营',
    getValue: (character) => FACTION_FULL_NAMES[character.factionId],
  },
  {
    key: 'EnglishName',
    label: ACTOR_ATTRIBUTE_PRESENTATION.EnglishName.label,
    getValue: (character) => character.EnglishName,
  },
  {
    key: 'positioning',
    label: '角色定位',
    getValue: (character) => {
      const tags =
        character.factionId === 'cat'
          ? character.catPositioningTags
          : character.mousePositioningTags;
      return sortPositioningTags(
        (tags ?? []).filter((tag) => isPositioningTagVisible(getPositioningTagLevel(tag))),
        character.factionId
      )
        .map((tag) => `${tag.tagName}${tag.weapon ? `（武器${tag.weapon}）` : ''}`)
        .join('、');
    },
  },
  {
    key: 'activeSkill',
    label: '主动技能',
    getValue: (character) => skillName(character, 'active'),
  },
  {
    key: 'weapon1Skill',
    label: '武器技能1',
    getValue: (character) => skillName(character, 'weapon1'),
  },
  {
    key: 'weapon2Skill',
    label: '武器技能2',
    getValue: (character) => skillName(character, 'weapon2'),
  },
  {
    key: 'passiveSkill',
    label: '被动技能',
    getValue: (character) => skillName(character, 'passive'),
  },
  {
    key: 'actorType',
    label: ACTOR_ATTRIBUTE_PRESENTATION.actorType.label,
    getValue: (character) => {
      const profile = getOptionalActorProfile(character.id);
      return profile ? formatActorType(profile.actorType) : undefined;
    },
  },
  {
    key: 'physicsType',
    label: ACTOR_ATTRIBUTE_PRESENTATION.physicsType.label,
    getValue: (character) => {
      const profile = getOptionalActorProfile(character.id);
      return profile ? formatActorPhysicsType(profile.physicsType) : undefined;
    },
  },
  {
    key: 'physicsBodyName',
    label: ACTOR_ATTRIBUTE_PRESENTATION.physicsBodyName.label,
    getValue: (character) =>
      formatActorPhysicsBodyName(getOptionalActorProfile(character.id)?.physicsBodyName),
  },
  {
    key: 'sex',
    label: ACTOR_ATTRIBUTE_PRESENTATION.sex.label,
    getValue: (character) => {
      const profile = getOptionalActorProfile(character.id);
      return profile ? formatActorSex(profile.sex) : undefined;
    },
  },
  {
    key: 'initialItem',
    label: ACTOR_ATTRIBUTE_PRESENTATION.initialItem.label,
    getValue: (character) => getOptionalActorProfile(character.id)?.initialItem,
  },
] as const satisfies readonly {
  key: string;
  label: string;
  getValue: (character: DeepReadonly<Character>) => string | undefined;
}[];

export type TableProperty = RankableProperty | (typeof TEXT_TABLE_PROPERTIES)[number]['key'];

export type TableColumn = TableProperty | 'rank' | 'character' | 'rankingValue';

const TABLE_COLUMN_KEYS = new Set<string>([
  'rank',
  'character',
  'rankingValue',
  ...RANKABLE_PROPERTIES.map((property) => property.key),
  ...TEXT_TABLE_PROPERTIES.map((property) => property.key),
]);

export function parseTableColumns(params: Pick<URLSearchParams, 'get' | 'getAll'>): TableColumn[] {
  const stored = params
    .getAll('column')
    .filter((key): key is TableColumn => TABLE_COLUMN_KEYS.has(key));
  const columns: TableColumn[] =
    params.get('layout') === 'custom'
      ? [...new Set(stored)]
      : [...new Set<TableColumn>(['rank', 'character', 'rankingValue', ...stored])];
  return columns;
}
