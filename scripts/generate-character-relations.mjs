import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const relationKeys = [
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

const targetTypeByRelation = {
  counters: 'character',
  counteredBy: 'character',
  counterEachOther: 'character',
  collaborators: 'character',
  countersKnowledgeCards: 'knowledgeCard',
  counteredByKnowledgeCards: 'knowledgeCard',
  countersSpecialSkills: 'specialSkill',
  counteredBySpecialSkills: 'specialSkill',
  advantageMaps: 'map',
  advantageModes: 'mode',
  disadvantageMaps: 'map',
  disadvantageModes: 'mode',
};

const requiresOppositeFaction = new Set([
  'countersKnowledgeCards',
  'counteredByKnowledgeCards',
  'countersSpecialSkills',
  'counteredBySpecialSkills',
]);

const rootDir = process.cwd();

const files = [
  {
    filePath: path.join(rootDir, 'src/features/characters/data/catCharacters.ts'),
    varName: 'catCharacterDefinitions',
    factionId: 'cat',
  },
  {
    filePath: path.join(rootDir, 'src/features/characters/data/mouseCharacters.ts'),
    varName: 'mouseCharacterDefinitions',
    factionId: 'mouse',
  },
];

const toOppositeFaction = (factionId) => (factionId === 'cat' ? 'mouse' : 'cat');

const getPropName = (nameNode) => {
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode) || ts.isNoSubstitutionTemplateLiteral(nameNode)) {
    return nameNode.text;
  }
  if (ts.isNumericLiteral(nameNode)) return nameNode.text;
  return null;
};

const getStringLiteral = (node) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return null;
};

const getBooleanLiteral = (node) => {
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
};

const unwrapExpression = (node) => {
  let current = node;
  while (current) {
    if (ts.isAsExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isSatisfiesExpression(current)) {
      current = current.expression;
      continue;
    }
    if (ts.isParenthesizedExpression(current)) {
      current = current.expression;
      continue;
    }
    return current;
  }
  return current;
};

const findObjectLiteral = (sourceFile, varName) => {
  let found = null;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (node.name.text === varName && node.initializer) {
        const initializer = unwrapExpression(node.initializer);
        if (initializer && ts.isObjectLiteralExpression(initializer)) {
          found = initializer;
        }
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sourceFile, visit);
  return found;
};

const formatSingleItem = (item) => {
  const parts = [`name: ${JSON.stringify(item.name)}`, `type: ${JSON.stringify(item.type)}`];
  if (item.factionId) {
    parts.push(`factionId: ${JSON.stringify(item.factionId)}`);
  }
  return `{ ${parts.join(', ')} }`;
};

const addTrait = (traits, keyBase, trait) => {
  let key = keyBase;
  let index = 1;
  while (traits[key]) {
    key = `${keyBase}-${index}`;
    index += 1;
  }
  traits[key] = trait;
};

const extractRelations = (sourceText, sourceFile, varName, factionId) => {
  const objectLiteral = findObjectLiteral(sourceFile, varName);
  if (!objectLiteral) {
    throw new Error(`Cannot find ${varName} in ${sourceFile.fileName}`);
  }

  const traits = {};
  const removals = [];
  const oppositeFactionId = toOppositeFaction(factionId);

  objectLiteral.properties.forEach((characterProp) => {
    if (!ts.isPropertyAssignment(characterProp)) return;
    const characterName = getPropName(characterProp.name);
    if (!characterName) return;
    if (!characterProp.initializer || !ts.isObjectLiteralExpression(characterProp.initializer))
      return;

    const characterObject = characterProp.initializer;
    characterObject.properties.forEach((relationProp) => {
      if (!ts.isPropertyAssignment(relationProp)) return;
      const relationKey = getPropName(relationProp.name);
      if (!relationKey || !relationKeys.includes(relationKey)) return;

      const initializer = relationProp.initializer;
      if (!initializer || !ts.isArrayLiteralExpression(initializer)) return;

      initializer.elements.forEach((element, _index) => {
        if (!ts.isObjectLiteralExpression(element)) return;

        let idValue = null;
        let descriptionValue = '';
        let isMinorValue = false;

        element.properties.forEach((itemProp) => {
          if (!ts.isPropertyAssignment(itemProp)) return;
          const itemKey = getPropName(itemProp.name);
          if (!itemKey) return;

          if (itemKey === 'id') {
            const idLiteral = getStringLiteral(itemProp.initializer);
            if (idLiteral !== null) {
              idValue = idLiteral;
            }
          } else if (itemKey === 'description') {
            const descLiteral = getStringLiteral(itemProp.initializer);
            if (descLiteral !== null) {
              descriptionValue = descLiteral;
            }
          } else if (itemKey === 'isMinor') {
            const minorLiteral = getBooleanLiteral(itemProp.initializer);
            if (minorLiteral !== null) {
              isMinorValue = minorLiteral;
            }
          }
        });

        if (!idValue) return;

        const subject = { name: characterName, type: 'character' };
        const targetType = targetTypeByRelation[relationKey];
        const target = {
          name: idValue,
          type: targetType,
          ...(requiresOppositeFaction.has(relationKey) ? { factionId: oppositeFactionId } : {}),
        };

        const trait = {
          description: descriptionValue ?? '',
          group: [subject, target],
          relation: {
            kind: relationKey,
            subject,
            target,
            isMinor: isMinorValue,
          },
        };

        const keyBase = `relation-${relationKey}-${characterName}-${targetType}-${idValue}`;
        addTrait(traits, keyBase, trait);
      });

      const start = relationProp.getStart(sourceFile);
      let end = relationProp.getEnd();
      let cursor = end;
      while (cursor < sourceText.length && /\s/.test(sourceText[cursor])) {
        cursor += 1;
      }
      if (sourceText[cursor] === ',') {
        cursor += 1;
        end = cursor;
      }
      removals.push({ start, end });
    });
  });

  return { traits, removals };
};

const removeRanges = (text, ranges) => {
  const sorted = [...ranges].sort((a, b) => b.start - a.start);
  let output = text;
  sorted.forEach(({ start, end }) => {
    output = output.slice(0, start) + output.slice(end);
  });
  return output;
};

const collectedTraits = {};

files.forEach(({ filePath, varName, factionId }) => {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const { traits, removals } = extractRelations(sourceText, sourceFile, varName, factionId);
  Object.entries(traits).forEach(([key, value]) => {
    if (collectedTraits[key]) {
      const fallbackKey = `${key}-${Math.random().toString(36).slice(2, 6)}`;
      collectedTraits[fallbackKey] = value;
    } else {
      collectedTraits[key] = value;
    }
  });

  if (removals.length > 0) {
    const nextText = removeRanges(sourceText, removals);
    fs.writeFileSync(filePath, nextText, 'utf8');
  }
});

const outputPath = path.join(rootDir, 'src/data/traits/characterRelations.ts');
const traitEntries = Object.entries(collectedTraits).sort(([a], [b]) =>
  a.localeCompare(b, 'zh-CN')
);

const lines = [];
lines.push("import type { Trait } from '@/data/types';");
lines.push('');
lines.push('const characterRelations: Record<string, Trait> = {');
traitEntries.forEach(([key, trait]) => {
  lines.push(`  ${JSON.stringify(key)}: {`);
  lines.push(`    description: ${JSON.stringify(trait.description ?? '')},`);
  lines.push(
    `    group: [${formatSingleItem(trait.group[0])}, ${formatSingleItem(trait.group[1])}],`
  );
  lines.push('    relation: {');
  lines.push(`      kind: ${JSON.stringify(trait.relation.kind)},`);
  lines.push(`      subject: ${formatSingleItem(trait.relation.subject)},`);
  lines.push(`      target: ${formatSingleItem(trait.relation.target)},`);
  lines.push(`      isMinor: ${trait.relation.isMinor ? 'true' : 'false'},`);
  lines.push('    },');
  lines.push('  },');
});
lines.push('};');
lines.push('');
lines.push('export default characterRelations;');
lines.push('');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

console.log(`Generated ${traitEntries.length} relation traits.`);
