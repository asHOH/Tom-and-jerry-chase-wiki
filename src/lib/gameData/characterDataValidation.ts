import { z } from 'zod';

// Validate required structure, not prose quality. Empty descriptions and optional fields are valid.
const text = z.string();
const knowledgeGroup = z.object({
  cards: z.array(z.unknown()),
  description: text.optional(),
  contributor: text.optional(),
});
const positioningTag = z.object({
  tagName: text,
  description: text,
  additionalDescription: text,
});
const character = z.object({
  id: text,
  description: text,
  skills: z.array(
    z.object({
      id: text,
      name: text,
      type: z.enum(['active', 'weapon1', 'weapon2', 'passive']),
      description: text.optional(),
      detailedDescription: text.optional(),
      skillLevels: z.array(
        z.object({
          level: z.number(),
          description: text,
          detailedDescription: text.optional(),
        })
      ),
    })
  ),
  skillAllocations: z
    .array(
      z.object({
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
      z.object({
        id: text,
        description: text,
        detailedDescription: text.optional(),
        groups: z.array(knowledgeGroup),
        defaultFolded: z.boolean(),
      }),
    ])
  ),
  specialSkills: z.array(z.object({ name: text, description: text })).optional(),
  recommendedStorePlans: z
    .array(z.object({ items: z.tuple([text, text, text, text]), description: text }))
    .optional(),
  catPositioningTags: z.array(positioningTag).optional(),
  mousePositioningTags: z.array(positioningTag).optional(),
});

export class InvalidGameDataValueError extends Error {
  constructor(readonly detail: { path: string }) {
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
    if (field !== undefined && !Object.hasOwn(character.shape, field)) continue;
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
      });
    }
  }
}
