import path from 'node:path';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

const sourcePath = path.join(process.cwd(), 'src/data/characterRelations.ts');
const sourceJiti = createJiti(sourcePath, {
  tsconfigPaths: path.join(process.cwd(), 'tsconfig.json'),
});

const loadRawCharacterRelationTraits = async () => {
  const { characterRelationTraits } = await sourceJiti.import('./characterRelations.ts');

  if (!Array.isArray(characterRelationTraits)) {
    throw new Error('Failed to load characterRelationTraits from source.');
  }

  return characterRelationTraits;
};

const main = async () => {
  const args = new Set(process.argv.slice(2));
  const json = args.has('--json');

  const traits = await loadRawCharacterRelationTraits();
  const { buildCharacterRelationEdgeKey, findCharacterRelationValidationErrors } =
    await jiti.import('../src/data/characterRelationValidation.ts');

  const errors = findCharacterRelationValidationErrors(traits);
  const duplicateErrors = errors.filter((error) => error.startsWith('Duplicate relation edge'));
  const contradictoryErrors = errors.filter((error) =>
    error.startsWith('Contradictory character relation kinds')
  );

  const relationKindCounts = traits.reduce((counts, trait) => {
    const kind = trait.relation?.kind;
    if (!kind) return counts;

    counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
  }, {});

  const uniqueEdgeKeys = new Set(
    traits
      .filter((trait) => trait.relation)
      .map((trait) => buildCharacterRelationEdgeKey(trait.relation))
  ).size;

  const report = {
    sourcePath,
    totalTraits: traits.length,
    uniqueEdgeKeys,
    duplicateErrors,
    contradictoryErrors,
    relationKindCounts,
    valid: errors.length === 0,
  };

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('Character relation report');
    console.log(`Source: ${path.relative(process.cwd(), sourcePath)}`);
    console.log(`Traits: ${report.totalTraits}`);
    console.log(`Unique edges: ${report.uniqueEdgeKeys}`);
    console.log(`Duplicate edge errors: ${report.duplicateErrors.length}`);
    console.log(`Contradictory pair errors: ${report.contradictoryErrors.length}`);
    console.log('Relation kind counts:');

    Object.entries(report.relationKindCounts)
      .sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
      .forEach(([kind, count]) => {
        console.log(`  ${kind}: ${count}`);
      });

    if (errors.length > 0) {
      console.log('Validation errors:');
      errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }
  }

  if (errors.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
