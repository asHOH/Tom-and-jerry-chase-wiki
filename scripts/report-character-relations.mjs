import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createJiti } from 'jiti';
import ts from 'typescript';

const jiti = createJiti(import.meta.url);

const sourcePath = path.join(process.cwd(), 'src/data/characterRelations.ts');

const loadRawCharacterRelationTraits = () => {
  const source = fs.readFileSync(sourcePath, 'utf8');

  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });

  const virtualModule = { exports: {} };
  const context = vm.createContext({
    exports: virtualModule.exports,
    module: virtualModule,
    require: (specifier) => {
      if (specifier === './characterRelationValidation') {
        return {
          assertValidCharacterRelations: () => {},
        };
      }

      throw new Error(`Unsupported require in characterRelations report loader: ${specifier}`);
    },
  });

  new vm.Script(outputText, { filename: sourcePath }).runInContext(context);

  if (!Array.isArray(virtualModule.exports.characterRelationTraits)) {
    throw new Error('Failed to load characterRelationTraits from source.');
  }

  return virtualModule.exports.characterRelationTraits;
};

const main = async () => {
  const args = new Set(process.argv.slice(2));
  const json = args.has('--json');

  const traits = loadRawCharacterRelationTraits();
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
