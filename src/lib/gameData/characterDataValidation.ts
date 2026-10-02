import isEqual from 'lodash-es/isEqual';
import { z } from 'zod';

import type { CharacterGameData } from '@/lib/dataManager';
import {
  CHARACTER_RELATION_KINDS,
  isCharacterRelationKind,
} from '@/lib/edit/characterRelationActions';
import type { TraitRelationKind } from '@/data/types';
import {
  getExplicitCharacterRelation,
  normalizeCharacterRelationProjection,
} from '@/features/characters/utils/relationReadModel';

// Validate required structure, not prose quality. Empty descriptions and optional fields are valid.
const text = z.string();
let cardGroup: z.ZodType = text;
for (let depth = 0; depth < 5; depth += 1) {
  cardGroup = z.union([text, z.tuple([z.union([z.literal(0), z.literal(1)])]).rest(cardGroup)]);
}
const knowledgeGroup = z.strictObject({
  cards: z.array(cardGroup),
  description: text.optional(),
  contributor: text.optional(),
});
const positioningTag = z.strictObject({
  tagName: text,
  weapon: z.union([z.literal(1), z.literal(2)]).optional(),
  level: z.number().int().min(0).max(4).optional(),
  description: text,
  additionalDescription: text,
});
const cancelKeys = z.array(
  z.enum(['道具键', '道具键*', '跳跃键', '移动键', '药水键', '本技能键', '其他技能键'])
);
const skillUsage = z.strictObject({
  canMoveWhileUsing: z.boolean().optional(),
  canUseInAir: z.boolean().optional(),
  cancelableSkill: z.union([cancelKeys, z.enum(['无前摇', '不可主动打断'])]).optional(),
  cancelableAftercast: z.union([cancelKeys, z.enum(['无后摇', '不可取消'])]).optional(),
  causesWoundedState: z.boolean().optional(),
  forecast: z.number().optional(),
  aftercast: z.number().optional(),
  canHitInPipe: z.boolean().optional(),
  cooldownTiming: z.enum(['前摇前', '释放时', '释放后']).optional(),
  cueRange: z.enum(['随距离远近变化', '全图可见', '本房间可见', '无音效']).optional(),
});
const relations = z
  .array(
    z.strictObject({
      id: text,
      description: text.optional(),
      isMinor: z.boolean(),
      tags: z.array(z.strictObject({ counters: text, counteredBy: text })).optional(),
    })
  )
  .optional();
const relationFields = Object.fromEntries(
  CHARACTER_RELATION_KINDS.map((kind) => [kind, relations])
) as Record<TraitRelationKind, typeof relations>;
const character = z.strictObject({
  id: text,
  description: text,
  imageUrl: text.optional(),
  aliases: z.array(text).optional(),
  factionId: z.enum(['cat', 'mouse']).optional(),
  faction: z.strictObject({ id: z.enum(['cat', 'mouse']), name: text }).optional(),
  createDate: text.nullable().optional(),
  EnglishName: text.optional(),
  specialClawKnifeCdHit: z.number().optional(),
  specialClawKnifeCdUnhit: z.number().optional(),
  counterTags: z.array(text).optional(),
  ...relationFields,
  skills: z.array(
    z
      .strictObject({
        id: text,
        name: text,
        type: z.enum(['active', 'weapon1', 'weapon2', 'passive']),
        description: text.optional(),
        detailedDescription: text.optional(),
        aliases: z.array(text).optional(),
        imageUrl: text.optional(),
        videoUrl: text.optional(),
        ...skillUsage.shape,
        parts: z.array(skillUsage).optional(),
        skillLevels: z.array(
          z.strictObject({
            level: z.number(),
            description: text,
            detailedDescription: text.optional(),
            cooldown: z.number().optional(),
            charges: z.number().optional(),
          })
        ),
      })
      .refine(
        (skill) =>
          skill.parts === undefined ||
          Object.keys(skillUsage.shape).every(
            (key) => skill[key as keyof typeof skill] === undefined
          )
      )
  ),
  skillAllocations: z
    .array(
      z.strictObject({
        id: text,
        pattern: text,
        weaponType: z.enum(['weapon1', 'weapon2']),
        description: text,
        additionaldescription: text.optional(),
      })
    )
    .optional(),
  knowledgeCardGroups: z.array(
    z.union([
      knowledgeGroup,
      z.strictObject({
        id: text,
        description: text,
        detailedDescription: text.optional(),
        groups: z.array(knowledgeGroup),
        defaultFolded: z.boolean(),
      }),
    ])
  ),
  specialSkills: z.array(z.strictObject({ name: text, description: text })).optional(),
  recommendedStorePlans: z
    .array(z.strictObject({ items: z.tuple([text, text, text, text]), description: text }))
    .optional(),
  catPositioningTags: z.array(positioningTag).optional(),
  mousePositioningTags: z.array(positioningTag).optional(),
});

export class InvalidGameDataValueError extends Error {
  constructor(
    readonly detail: {
      path: string;
      reason?:
        | 'unsupported_field'
        | 'new_character'
        | 'relation_conflict'
        | 'no_changes'
        | 'knowledge_card_cost';
    }
  ) {
    super('invalid_game_data');
    this.name = 'InvalidGameDataValueError';
  }
}

/** Check the final affected character fields, including replacements of their ancestors. */
export function validateCharacterData(
  target: Record<string, unknown>,
  actionPaths: readonly string[]
): void {
  const scopes = new Set(actionPaths.map((path) => path.trim().split('.').slice(0, 2).join('.')));
  for (const scope of scopes) {
    const [root, field] = scope.split('.') as [string, string?];
    const value = target[root];
    if (field !== undefined && !Object.hasOwn(character.shape, field)) {
      throw new InvalidGameDataValueError({ path: scope, reason: 'unsupported_field' });
    }
    const schema =
      field === undefined ? character : character.shape[field as keyof typeof character.shape];
    const result = schema.safeParse(
      field === undefined
        ? value
        : value !== null && typeof value === 'object'
          ? (value as Record<string, unknown>)[field]
          : undefined
    );
    if (!result.success) {
      throw new InvalidGameDataValueError({
        path: [scope, ...result.error.issues[0]!.path].join('.'),
        ...(result.error.issues[0]!.code === 'unrecognized_keys'
          ? { reason: 'unsupported_field' as const }
          : {}),
      });
    }
  }

  if (
    actionPaths.some((path) => {
      const field = path.split('.')[1];
      return field === undefined || field === 'factionId' || isCharacterRelationKind(field);
    })
  ) {
    const characters = target as CharacterGameData;
    // Check explicit relations before rendering drops conflicting entries. Tag-derived
    // suggestions intentionally retain their existing display-time precedence rules.
    for (const id of Object.keys(characters)) {
      const explicit = getExplicitCharacterRelation(characters, id);
      const normalized = normalizeCharacterRelationProjection(id, explicit, {
        getCharacterFactionId: (targetId) => characters[targetId]?.factionId,
      });
      const conflict = CHARACTER_RELATION_KINDS.find(
        (kind) => !isEqual(explicit[kind], normalized[kind])
      );
      if (conflict) {
        throw new InvalidGameDataValueError({
          path: `${id}.${conflict}`,
          reason: 'relation_conflict',
        });
      }
    }
  }
}
