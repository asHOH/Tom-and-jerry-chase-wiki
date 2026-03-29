import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import * as prettier from 'prettier';

const args = new Set(process.argv.slice(2));
const isCheckMode = args.has('--check');
const showReport = args.has('--report');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jiti = createJiti(import.meta.url, {
  interopDefault: true,
  moduleCache: false,
  alias: {
    '@/': `${path.join(repoRoot, 'src')}/`,
  },
});
const targetFilePath = path.join(repoRoot, 'src/data/characterRelations.ts');

const { characterRelationDefinitions } = await jiti.import(
  path.join(repoRoot, 'src/data/characterRelations.ts')
);
const { characterDisplayOrder } = await jiti.import(
  path.join(repoRoot, 'src/features/characters/data/characterMetadata.ts')
);
const {
  getCanonicalCharacterRelationStorageLocation,
  getCharacterFaction,
  mergeCanonicalRelationEntries,
} = await jiti.import(
  path.join(repoRoot, 'src/features/characters/utils/characterRelationCanonicalization.ts')
);

const sourceKindOrder = [
  'counters',
  'counterEachOther',
  'collaborators',
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
  'advantageMaps',
  'advantageModes',
  'disadvantageMaps',
  'disadvantageModes',
];

const originalSubjectOrder = Object.keys(characterRelationDefinitions);

const normalizedDefinitions = {};
const normalizedEntryIndex = new Map();
const conflicts = [];
const stats = {
  convertedCounteredBy: 0,
  relocatedCollaborators: 0,
  relocatedCounterEachOther: 0,
  mergedDuplicates: 0,
};

const subjectSortKey = new Map(
  [...characterDisplayOrder, ...originalSubjectOrder].map((subjectName, index) => [
    subjectName,
    index,
  ])
);

const getSubjectOrder = (subjectName) => subjectSortKey.get(subjectName) ?? Number.MAX_SAFE_INTEGER;
const getCharacterTargetOrder = (target) =>
  target.type === 'character' ? getSubjectOrder(target.name) : Number.MAX_SAFE_INTEGER;

const ensureOwnerBucket = (ownerId, kind) => {
  normalizedDefinitions[ownerId] ??= {};
  normalizedDefinitions[ownerId][kind] ??= [];
  return normalizedDefinitions[ownerId][kind];
};

const getTargetIdentity = (target) => {
  if (target.type === 'knowledgeCard' || target.type === 'specialSkill') {
    return `${target.type}:${target.factionId}:${target.name}`;
  }

  return `${target.type}:${target.name}`;
};

const getSemanticKey = (ownerId, kind, target) => `${kind}|${ownerId}|${getTargetIdentity(target)}`;

const normalizeDescription = (description) => description.trim();

for (const [subjectId, relationDefinitions] of Object.entries(characterRelationDefinitions)) {
  for (const [rawKind, rawEntries] of Object.entries(relationDefinitions)) {
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      continue;
    }

    for (const rawEntry of rawEntries) {
      const normalizedDescription = normalizeDescription(rawEntry.description);

      if (rawKind === 'counterEachOther') {
        const ownerId = getCanonicalCharacterRelationStorageLocation(
          subjectId,
          rawKind,
          rawEntry.target.name
        )?.ownerId;
        const leftFaction = getCharacterFaction(subjectId);
        const rightFaction = getCharacterFaction(rawEntry.target.name);

        if (!ownerId || !leftFaction || !rightFaction || leftFaction === rightFaction) {
          conflicts.push({
            type: 'invalid-counterEachOther',
            subjectId,
            targetId: rawEntry.target.name,
            message: 'counterEachOther must be a mouse-vs-cat pair and stored on the mouse side.',
          });
          continue;
        }
      }

      const storageLocation = getCanonicalCharacterRelationStorageLocation(
        subjectId,
        rawKind,
        rawEntry.target.name
      );

      if (!storageLocation) {
        conflicts.push({
          type: 'invalid-relation',
          subjectId,
          kind: rawKind,
          targetId: rawEntry.target.name,
          message: `Cannot canonicalize ${rawKind} for ${subjectId} -> ${rawEntry.target.name}.`,
        });
        continue;
      }

      if (rawKind === 'counteredBy') {
        stats.convertedCounteredBy += 1;
      }
      if (rawKind === 'collaborators' && storageLocation.ownerId !== subjectId) {
        stats.relocatedCollaborators += 1;
      }
      if (rawKind === 'counterEachOther' && storageLocation.ownerId !== subjectId) {
        stats.relocatedCounterEachOther += 1;
      }

      const normalizedTarget =
        storageLocation.targetId === rawEntry.target.name
          ? rawEntry.target
          : {
              ...rawEntry.target,
              name: storageLocation.targetId,
            };

      const semanticKey = getSemanticKey(
        storageLocation.ownerId,
        storageLocation.kind,
        normalizedTarget
      );
      const existingEntry = normalizedEntryIndex.get(semanticKey);

      if (!existingEntry) {
        const nextEntry = {
          target: normalizedTarget,
          description: normalizedDescription,
          ...(rawEntry.isMinor ? { isMinor: true } : {}),
        };
        ensureOwnerBucket(storageLocation.ownerId, storageLocation.kind).push(nextEntry);
        normalizedEntryIndex.set(semanticKey, nextEntry);
        continue;
      }

      const mergeResult = mergeCanonicalRelationEntries(existingEntry, {
        description: normalizedDescription,
        isMinor: rawEntry.isMinor ?? false,
      });

      if (mergeResult.conflict) {
        conflicts.push({
          type: 'conflicting-duplicate',
          ownerId: storageLocation.ownerId,
          kind: storageLocation.kind,
          targetId: normalizedTarget.name,
          ...mergeResult.conflict,
        });
        continue;
      }

      existingEntry.description = mergeResult.merged.description ?? '';
      if (mergeResult.merged.isMinor) {
        existingEntry.isMinor = true;
      } else {
        delete existingEntry.isMinor;
      }
      stats.mergedDuplicates += 1;
    }
  }
}

const orderedSubjectIds = Object.keys(normalizedDefinitions).sort(
  (leftId, rightId) => getSubjectOrder(leftId) - getSubjectOrder(rightId)
);

const serializeString = (value) =>
  `'${String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replaceAll('\u0008', '\\b')
    .replaceAll('\u000C', '\\f')
    .replaceAll('\u000B', '\\v')
    .replaceAll('\0', '\\0')}'`;

const isBareObjectKey = (value) =>
  /^[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*$/u.test(value);
const serializeObjectKey = (value) => (isBareObjectKey(value) ? value : serializeString(value));

const serializeTarget = (target) => {
  switch (target.type) {
    case 'character':
      return `character(${serializeString(target.name)})`;
    case 'map':
      return `map(${serializeString(target.name)})`;
    case 'mode':
      return `mode(${serializeString(target.name)})`;
    case 'knowledgeCard':
      return `knowledgeCard(${serializeString(target.name)}, ${serializeString(target.factionId)})`;
    case 'specialSkill':
      return `specialSkill(${serializeString(target.name)}, ${serializeString(target.factionId)})`;
    default:
      throw new Error(`Unsupported target type: ${target.type}`);
  }
};

const serializeEntry = (entry) => {
  const lines = [
    '      {',
    `        target: ${serializeTarget(entry.target)},`,
    `        description: ${serializeString(entry.description ?? '')},`,
  ];

  if (entry.isMinor) {
    lines.push('        isMinor: true,');
  }

  lines.push('      },');
  return lines.join('\n');
};

const serializeKindEntries = (kind, entries) => {
  const serializedEntries = entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const orderDifference =
        getCharacterTargetOrder(left.entry.target) - getCharacterTargetOrder(right.entry.target);

      return orderDifference !== 0 ? orderDifference : left.index - right.index;
    })
    .map(({ entry }) => serializeEntry(entry))
    .join('\n');

  return `    ${kind}: [\n${serializedEntries}\n    ],`;
};

const serializedDefinitions = `{\n${orderedSubjectIds
  .map((subjectId) => {
    const relationDefinitions = normalizedDefinitions[subjectId];
    const kinds = sourceKindOrder.filter(
      (kind) => Array.isArray(relationDefinitions[kind]) && relationDefinitions[kind].length > 0
    );
    const serializedKinds = kinds
      .map((kind) => serializeKindEntries(kind, relationDefinitions[kind]))
      .join('\n');

    return `  ${serializeObjectKey(subjectId)}: {\n${serializedKinds}\n  },`;
  })
  .join('\n')}\n}`;

const fileContent = await fs.readFile(targetFilePath, 'utf8');
const declarationPattern =
  /export const characterRelationDefinitions = \{[\s\S]*?\} as const satisfies Readonly<Record<string, CharacterRelationDefinitions>>;/;
if (!declarationPattern.test(fileContent)) {
  throw new Error(
    'Failed to locate characterRelationDefinitions declaration in characterRelations.ts.'
  );
}
const normalizedFileContent = fileContent.replace(
  declarationPattern,
  `export const characterRelationDefinitions = ${serializedDefinitions} as const satisfies Readonly<Record<string, CharacterRelationDefinitions>>;`
);
const prettierConfig = await prettier.resolveConfig(targetFilePath);
const nextFileContent = await prettier.format(normalizedFileContent, {
  ...prettierConfig,
  filepath: targetFilePath,
});

if (nextFileContent === fileContent && conflicts.length === 0) {
  if (showReport) {
    console.log('characterRelations.ts is already canonical.');
  }
  process.exit(0);
}

if (showReport || isCheckMode || conflicts.length > 0) {
  console.log(
    JSON.stringify(
      {
        changed: nextFileContent !== fileContent,
        stats,
        conflicts,
      },
      null,
      2
    )
  );
}

if (conflicts.length > 0) {
  process.exit(1);
}

if (isCheckMode) {
  process.exit(nextFileContent === fileContent ? 0 : 1);
}

await fs.writeFile(targetFilePath, nextFileContent, 'utf8');
