import { resolve } from 'node:path';
import { createJiti } from 'jiti';

import type {
  ActorProfileReference,
  PlayableCharacterRef,
} from '../src/features/character-roles/schema';
import {
  catCharacterIds,
  mouseCharacterIds,
} from '../src/features/characters/data/characterMetadata';

type RoleReferencingDefinition = {
  characterRoleName?: string;
  itemAttributesAsCharacter?: unknown;
  entityAttributesAsCharacter?: unknown;
  fixtureAttributesAsCharacter?: unknown;
};

type DataModule = {
  default: Readonly<Record<string, RoleReferencingDefinition>>;
};

const jiti = createJiti(import.meta.url, {
  alias: { '@': resolve(process.cwd(), 'src') },
});

const loadDataModule = async (relativePath: string) => {
  const modulePath = resolve(process.cwd(), relativePath);
  return jiti.import<DataModule>(modulePath);
};

const collectReferences = (
  collectionName: string,
  definitions: Readonly<Record<string, RoleReferencingDefinition>>,
  legacyKey:
    'itemAttributesAsCharacter' | 'entityAttributesAsCharacter' | 'fixtureAttributesAsCharacter'
): ActorProfileReference[] =>
  Object.entries(definitions).flatMap(([name, definition]) => {
    if (definition.characterRoleName === undefined) return [];
    if (typeof definition.characterRoleName !== 'string') {
      throw new Error(`${collectionName} ${name}: characterRoleName must be a string`);
    }
    return [
      {
        source: `${collectionName} ${name}`,
        name: definition.characterRoleName,
        hasLegacyRepresentation: definition[legacyKey] !== undefined,
      },
    ];
  });

export const getPlayableCharacterRoles = (): readonly PlayableCharacterRef[] => [
  ...catCharacterIds.map((id) => ({ id, factionId: 'cat' as const })),
  ...mouseCharacterIds.map((id) => ({ id, factionId: 'mouse' as const })),
];

export const getActorProfileReferences = async (): Promise<readonly ActorProfileReference[]> => {
  const [itemsModule, entitiesModule, fixturesModule] = await Promise.all([
    loadDataModule('src/features/items/data/items.ts'),
    loadDataModule('src/features/entities/data/entities.ts'),
    loadDataModule('src/features/fixtures/data/fixtures.ts'),
  ]);

  return [
    ...collectReferences('item', itemsModule.default, 'itemAttributesAsCharacter'),
    ...collectReferences('entity', entitiesModule.default, 'entityAttributesAsCharacter'),
    ...collectReferences('fixture', fixturesModule.default, 'fixtureAttributesAsCharacter'),
  ];
};
