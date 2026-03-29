import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

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

const manualConflictResolutions = {
  'counters|布奇|character:米可':
    '布奇伤害较高，容易击倒米可；虚弱起身无敌时间长，三级桶盖还有霸体，相对更容易处理米可。',
  'counters|布奇|character:泰菲':
    '布奇基础伤害高，能一刀或配合道具快速击倒泰菲；三级桶盖赋予霸体，一定程度上限制泰菲火箭筒、地雷和圆滚滚的发挥。',
  'counters|罗宾汉杰瑞|character:布奇':
    '罗宾汉杰瑞拉扯能力较强，二段跳和降落伞能更好规避布奇的冲刺；不过布奇的武器技能对罗宾汉杰瑞仍有威慑。',
  'counters|梦游杰瑞|character:布奇':
    '梦游杰瑞强推和自保能力都较强；同时布奇冲撞会将奶酪撞出洞口，而梦游杰瑞能利用这一点进一步推进奶酪。',
  'counters|尼宝|character:布奇': '尼宝翻滚救援不会被布奇拦截，桶盖霸体也会被鱼钩勾下。',
  'counters|尼宝|character:牛仔汤姆':
    '牛仔汤姆拦不住尼宝的翻滚，也不好抓到尼宝；另外尼宝往往携带逃窜，进一步克制牛仔汤姆。',
  'counterEachOther|恶魔泰菲|character:牛仔汤姆':
    '恶魔泰菲绿恶魔的高伤和蓝恶魔的禁技能快速击倒牛仔汤姆，但牛仔汤姆同样能利用高爆发、三被和绿恶魔反制恶魔泰菲。',
  'counters|佩克斯|character:汤姆': '佩克斯团队增益较强，击退也有一定能力反制汤姆的无敌。',
  'counters|如玉|character:朝圣者泰菲':
    '朝圣者泰菲子弹伤害高，容易触发如玉坚毅状态；同时这些子弹也可能被如玉主动技能反向利用刷反击。',
  'counters|牛仔杰瑞|character:斯飞':
    '斯飞须格外小心牛仔杰瑞仙人掌和琴带来的控制、减速与霸体反制。',
  'counters|航海士杰瑞|character:斯飞':
    '航海士杰瑞的控制、减速与火药桶都能打断斯飞追击节奏，火药桶炸火箭也让斯飞头疼；同时航海士杰瑞破墙很快，斯飞较难守住墙缝。',
  'counters|罗宾汉泰菲|character:斯飞':
    '罗宾汉泰菲的圆球和投掷道具都能打断斯飞的疾冲状态，并削弱其攻势。',
  'counters|尼宝|character:斯飞':
    '斯飞拦不住尼宝的翻滚，也无法免疫鱼钩的控制；但斯飞在“疾冲”状态下被勾时，抓在手上的老鼠仍会被电。',
  'counters|侍卫汤姆|character:泰菲':
    '侍卫汤姆移速快，在Lv.2被动加成下能快速击倒泰菲；视野大克制远程火箭筒，还能用火炮刷新护盾、禁用技能并解除增益，进一步限制泰菲。',
  'counters|苏蕊|character:泰菲':
    '苏蕊跳舞有霸体且伤害高，克制伤害高但血量低、主要依赖控制的泰菲；同时跳舞可直接把老鼠带上火箭，也能打断泰菲火箭筒前摇。',
  'collaborators|国王杰瑞|character:泰菲':
    '国王杰瑞的强化救援战旗配合泰菲的圆滚滚无敌位移，可以实现稳救。',
  'counters|托普斯|character:天使泰菲':
    '托普斯的捕虫网能无视天使泰菲两个技能；即便开启三级友情庇护，也可能被托普斯结合击晕、“我生气了！”和一级元气满满连续控制。',
  'counters|侦探杰瑞|character:斯飞':
    '侦探杰瑞推速很快，能缩短奶酪期；同时烟雾弹带来的减速与沉默也会让斯飞难以有效进攻。',
};

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
        const manualResolution = manualConflictResolutions[semanticKey];
        if (manualResolution) {
          existingEntry.description = manualResolution.trim();
          if (!!existingEntry.isMinor && !!rawEntry.isMinor) {
            existingEntry.isMinor = true;
          } else {
            delete existingEntry.isMinor;
          }
          stats.mergedDuplicates += 1;
          continue;
        }
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

const serializeTarget = (target) => {
  switch (target.type) {
    case 'character':
      return `character(${JSON.stringify(target.name)})`;
    case 'map':
      return `map(${JSON.stringify(target.name)})`;
    case 'mode':
      return `mode(${JSON.stringify(target.name)})`;
    case 'knowledgeCard':
      return `knowledgeCard(${JSON.stringify(target.name)}, ${JSON.stringify(target.factionId)})`;
    case 'specialSkill':
      return `specialSkill(${JSON.stringify(target.name)}, ${JSON.stringify(target.factionId)})`;
    default:
      throw new Error(`Unsupported target type: ${target.type}`);
  }
};

const serializeEntry = (entry) => {
  const lines = [
    '      {',
    `        target: ${serializeTarget(entry.target)},`,
    `        description: ${JSON.stringify(entry.description ?? '')},`,
  ];

  if (entry.isMinor) {
    lines.push('        isMinor: true,');
  }

  lines.push('      },');
  return lines.join('\n');
};

const serializeKindEntries = (kind, entries) => {
  const serializedEntries = entries.map((entry) => serializeEntry(entry)).join('\n');
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

    return `  ${JSON.stringify(subjectId)}: {\n${serializedKinds}\n  },`;
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
const nextFileContent = fileContent.replace(
  declarationPattern,
  `export const characterRelationDefinitions = ${serializedDefinitions} as const satisfies Readonly<Record<string, CharacterRelationDefinitions>>;`
);

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
