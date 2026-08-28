#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const scriptsDir = fileURLToPath(new URL('..', import.meta.url));
const projectDir = resolve(scriptsDir, '..');
const serverOnlyStub = fileURLToPath(new URL('./server-only-stub.mjs', import.meta.url));
const CHARACTER_RELATION_KEYS = [
  'counters',
  'counteredBy',
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

class ParityRunnerError extends Error {
  constructor(code) {
    super(code);
    this.name = 'ParityRunnerError';
    this.code = code;
  }
}

function normalizeCharacterRelations(relations) {
  return Object.fromEntries(
    CHARACTER_RELATION_KEYS.map((relationKey) => [
      relationKey,
      [...relations[relationKey]].sort((left, right) => left.id.localeCompare(right.id, 'zh-CN')),
    ])
  );
}

function parseArgs(args) {
  let sourceRoot;
  let snapshotFile;
  let dataOutputFile;
  let excludeIds = [];
  let verificationCutoverIds = [];
  let verificationDependencyIds = [];

  for (const arg of args) {
    if (arg.startsWith('--source-root=')) sourceRoot = arg.slice('--source-root='.length);
    else if (arg.startsWith('--snapshot-file=')) {
      snapshotFile = arg.slice('--snapshot-file='.length);
    } else if (arg.startsWith('--exclude-ids=')) {
      excludeIds = arg.slice('--exclude-ids='.length).split(',').filter(Boolean);
    } else if (arg.startsWith('--data-output-file=')) {
      dataOutputFile = arg.slice('--data-output-file='.length);
    } else if (arg.startsWith('--verification-cutover-ids=')) {
      verificationCutoverIds = arg
        .slice('--verification-cutover-ids='.length)
        .split(',')
        .filter(Boolean);
    } else if (arg.startsWith('--verification-dependency-ids=')) {
      verificationDependencyIds = arg
        .slice('--verification-dependency-ids='.length)
        .split(',')
        .filter(Boolean);
    } else {
      throw new ParityRunnerError('invalid_argument');
    }
  }

  if (!sourceRoot || !snapshotFile) throw new ParityRunnerError('required_argument_missing');
  return {
    sourceRoot: resolve(sourceRoot),
    snapshotFile: isAbsolute(snapshotFile) ? snapshotFile : resolve(snapshotFile),
    dataOutputFile:
      dataOutputFile === undefined
        ? undefined
        : isAbsolute(dataOutputFile)
          ? dataOutputFile
          : resolve(dataOutputFile),
    excludeIds: new Set(excludeIds),
    verificationCutoverIds,
    verificationDependencyIds,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourceJiti = createJiti(import.meta.url, {
    alias: {
      '@': join(args.sourceRoot, 'src'),
      'server-only': serverOnlyStub,
    },
  });
  const helperJiti = createJiti(import.meta.url, {
    alias: { '@': join(projectDir, 'src') },
  });
  const { createApprovedActionSnapshotFromRows } = sourceJiti(
    join(args.sourceRoot, 'src/lib/gameData/published/approvedActionSnapshot.ts')
  );
  const { getCanonicalGameData } = sourceJiti(
    join(args.sourceRoot, 'src/lib/gameData/published/canonicalSources.ts')
  );
  const { selectPublishedGameData } = sourceJiti(
    join(args.sourceRoot, 'src/lib/gameData/published/selectPublishedDomain.ts')
  );
  const { PUBLISHABLE_ENTITY_TYPES } = sourceJiti(
    join(args.sourceRoot, 'src/lib/gameData/publishableEntityTypes.ts')
  );
  const { getCharacterRelation } = sourceJiti(
    join(args.sourceRoot, 'src/features/characters/utils/relationReadModel.ts')
  );
  const { createCanonicalCompactionDigest } = helperJiti(
    join(projectDir, 'src/lib/gameData/compactionVerification.ts')
  );

  const storedRows = JSON.parse(await readFile(args.snapshotFile, 'utf8'));
  if (!Array.isArray(storedRows)) throw new ParityRunnerError('invalid_snapshot_file');
  const rows = storedRows.filter((row) => !args.excludeIds.has(row.id));
  const snapshot = createApprovedActionSnapshotFromRows(rows);
  const publishedData = {};
  const domains = PUBLISHABLE_ENTITY_TYPES.map((entityType) => {
    const data = selectPublishedGameData(entityType, getCanonicalGameData(entityType), snapshot);
    const readModel =
      entityType === 'characters'
        ? Object.fromEntries(
            Object.entries(data).map(([characterId, character]) => [
              characterId,
              {
                ...character,
                ...normalizeCharacterRelations(getCharacterRelation(data, characterId)),
              },
            ])
          )
        : data;
    publishedData[entityType] = readModel;
    const digest = createCanonicalCompactionDigest(readModel);
    return { entityType, ...digest };
  });

  if (args.dataOutputFile) {
    await writeFile(args.dataOutputFile, JSON.stringify(publishedData), 'utf8');
  }

  let patchVerification = null;
  if (args.verificationCutoverIds.length > 0 || args.verificationDependencyIds.length > 0) {
    if (args.verificationCutoverIds.length === 0) {
      throw new ParityRunnerError('verification_cutover_ids_missing');
    }
    const storedRowsById = new Map(storedRows.map((row) => [row.id, row]));
    const selectVerificationRows = (ids) =>
      ids.map((rowId) => {
        const row = storedRowsById.get(rowId);
        if (!row) throw new ParityRunnerError('verification_row_missing');
        return { ...row, is_public: true };
      });
    const { createActionPatchTargetRegistry } = sourceJiti(
      join(args.sourceRoot, 'src/lib/gameData/actionPatchTargets.ts')
    );
    const { verifyCompactionActionPatch } = sourceJiti(
      join(args.sourceRoot, 'src/lib/gameData/compactionPatchVerification.ts')
    );
    patchVerification = verifyCompactionActionPatch(
      selectVerificationRows(args.verificationCutoverIds),
      selectVerificationRows(args.verificationDependencyIds),
      createActionPatchTargetRegistry()
    );
  }

  process.stdout.write(
    `${JSON.stringify({ sourceRoot: args.sourceRoot, domains, patchVerification })}\n`
  );
}

main().catch((error) => {
  process.stderr.write(
    `${JSON.stringify({ error: { code: error instanceof ParityRunnerError ? error.code : 'parity_runner_failed' } })}\n`
  );
  process.exitCode = 1;
});
