// @ts-check

import { rm, writeFile } from 'node:fs/promises';
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);

/** @typedef {import("../src/data/types").Trait} Trait */
/** @typedef {import("../src/data/types").TraitRelation} TraitRelation */
/** @typedef {import("../src/data/types").TraitRelationKind} TraitRelationKind */

/**
 * @template {TraitRelationKind} T
 * @param {Trait} relation
 * @param {T} kind
 * @return {Trait}
 */
function reverseRelation(relation, kind) {
  return {
    ...relation,
    group: relation.group.slice().reverse(),
    relation: {
      ...relation.relation,
      kind,
      subject: /** @type {TraitRelation} */ (relation.relation).target,
      target: /** @type {TraitRelation} */ (relation.relation).subject,
    },
  };
}

const buildRelationFunctionString = `\
function buildRelation(traits: Trait[]) {
  return Object.fromEntries(traits.map((trait) => [\`\${trait.relation!.kind}-\${trait.relation!.subject.name}-\${trait.relation!.target.name}\`, trait]));
}
`;

async function main() {
  const { default: characterRelations } = /** @type {{default: Record<string, Trait>}} */ (
    await jiti.import('../src/data/traits/characterRelations.js')
  );

  const relations = Object.values(characterRelations).map((relation) => {
    if (relation.relation?.kind == 'counteredBy') {
      return reverseRelation(relation, 'counters');
    }
    return relation;
  });

  await rm('./src/data/traits', { recursive: true, force: true });

  const code = `import type { Trait } from '@/data/types';\n${buildRelationFunctionString}const characterRelations: Trait[] = ${JSON.stringify(relations)};\nexport default buildRelation(characterRelations);`;

  await writeFile('./src/data/characterRelations.ts', code);
}

main();
