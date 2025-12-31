/**
 * Field metadata registry for edit mode.
 * Defines properties of editable fields (single-line, multi-line, validators, etc.)
 * for different entity types. Serves as a reference for component implementations
 * and can be extended for new entity types.
 */

export type EntityType = 'character' | 'faction' | 'knowledgeCard' | 'item' | 'trait';

export interface FieldMetadata {
  isSingleLine?: boolean;
  description?: string;
  validator?: (value: unknown) => boolean;
  maxLength?: number;
  minLength?: number;
}

/**
 * Field metadata registry indexed by [entityType][path]
 * Can be queried at runtime to determine field properties without hardcoding.
 *
 * @example
 * const isSingleLine = fieldMetadataRegistry.character?.['skills.0.name']?.isSingleLine;
 * const maxLen = fieldMetadataRegistry.knowledgeCard?.['title']?.maxLength;
 */
export const fieldMetadataRegistry: Partial<Record<EntityType, Record<string, FieldMetadata>>> = {
  character: {
    // ID and name fields
    id: {
      isSingleLine: true,
      description: 'Character unique identifier',
      maxLength: 100,
    },
    name: {
      isSingleLine: true,
      description: 'Character display name',
      maxLength: 50,
    },

    // Skill fields
    'skills.*.name': {
      isSingleLine: true,
      description: 'Skill name',
      maxLength: 50,
    },
    'skills.*.description': {
      isSingleLine: false,
      description: 'Skill detailed description',
    },
    'skills.*.detailedDescription': {
      isSingleLine: false,
      description: 'Additional skill description',
    },
    'skills.*.forecast': {
      isSingleLine: true,
      description: 'Skill wind-up time in seconds',
      validator: (val: unknown) => typeof val === 'number' && val >= 0,
    },
    'skills.*.aftercast': {
      isSingleLine: true,
      description: 'Skill recovery time in seconds',
      validator: (val: unknown) => typeof val === 'number' && val >= 0,
    },
    'skills.*.videoUrl': {
      isSingleLine: false,
      description: 'URL to skill demonstration video',
    },
    'skills.*.aliases.*': {
      isSingleLine: true,
      description: 'Alternative skill name',
      maxLength: 50,
    },

    // Skill level fields
    'skills.*.skillLevels.*.cooldown': {
      isSingleLine: true,
      description: 'Skill cooldown in seconds',
      validator: (val: unknown) => typeof val === 'number' && val >= 0,
    },
    'skills.*.skillLevels.*.charges': {
      isSingleLine: true,
      description: 'Skill charge count',
      validator: (val: unknown) => typeof val === 'number' && val >= 1,
    },
    'skills.*.skillLevels.*.description': {
      isSingleLine: false,
      description: 'Skill level description',
    },

    // Skill allocation fields
    'skillAllocations.*.id': {
      isSingleLine: true,
      description: 'Skill allocation set ID',
      maxLength: 50,
    },
    'skillAllocations.*.pattern': {
      isSingleLine: true,
      description: 'Skill allocation pattern',
      maxLength: 100,
    },
    'skillAllocations.*.description': {
      isSingleLine: false,
      description: 'Skill allocation description',
    },

    // Positioning tags
    'catPositioningTags.*.tagName': {
      isSingleLine: true,
      description: 'Tag name',
      maxLength: 30,
    },
    'catPositioningTags.*.description': {
      isSingleLine: false,
      description: 'Tag description',
    },
    'mousePositioningTags.*.tagName': {
      isSingleLine: true,
      description: 'Tag name',
      maxLength: 30,
    },
    'mousePositioningTags.*.description': {
      isSingleLine: false,
      description: 'Tag description',
    },
  },

  knowledgeCard: {
    id: {
      isSingleLine: true,
      description: 'Knowledge card unique ID',
      maxLength: 100,
    },
    title: {
      isSingleLine: true,
      description: 'Card title',
      maxLength: 100,
    },
    description: {
      isSingleLine: false,
      description: 'Card description or content',
    },
    category: {
      isSingleLine: true,
      description: 'Card category/tag',
      maxLength: 50,
    },
  },
};

/**
 * Retrieves metadata for a specific field in an entity type.
 * Returns undefined if no metadata is found.
 *
 * @param entityType The type of entity
 * @param fieldPath The dot-notation path to the field
 * @returns Field metadata or undefined
 *
 * @example
 * const meta = getFieldMetadata('character', 'skills.0.name');
 * if (meta?.isSingleLine) {
 *   // handle single-line field
 * }
 */
export function getFieldMetadata(
  entityType: EntityType,
  fieldPath: string
): FieldMetadata | undefined {
  const registry = fieldMetadataRegistry[entityType];
  if (!registry) return undefined;

  // Direct match
  if (registry[fieldPath]) {
    return registry[fieldPath];
  }

  // Wildcard match: try replacing array indices with *
  const wildcardPath = fieldPath.replace(/\.\d+\./g, '.*.').replace(/\.\d+$/, '.*');
  if (wildcardPath !== fieldPath && registry[wildcardPath]) {
    return registry[wildcardPath];
  }

  return undefined;
}

/**
 * Checks if a field should be single-line (Enter to blur) or multi-line.
 * Queries the metadata registry first; falls back to default (false).
 *
 * @param entityType The type of entity
 * @param fieldPath The dot-notation path to the field
 * @returns True if field is single-line, false otherwise
 *
 * @example
 * const isSingleLine = isFieldSingleLine('character', 'skills.0.name');
 */
export function isFieldSingleLine(entityType: EntityType, fieldPath: string): boolean {
  const metadata = getFieldMetadata(entityType, fieldPath);
  return metadata?.isSingleLine ?? false;
}

/**
 * Registers a custom entity type and its field metadata.
 * Allows extending the registry at runtime for new entity types.
 *
 * @param entityType The new entity type name
 * @param metadata Field metadata for this entity type
 *
 * @example
 * registerEntityType('customItem', {
 *   id: { isSingleLine: true },
 *   description: { isSingleLine: false },
 * });
 */
export function registerEntityType(
  entityType: EntityType,
  metadata: Record<string, FieldMetadata>
): void {
  fieldMetadataRegistry[entityType] = metadata;
}
