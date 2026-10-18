import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { convertToPinyin } from '@/lib/pinyinUtils';
import type { ItemGroup } from '@/data/types';

const REFERENCE_DOMAINS = {
  角色: { type: 'characters', route: 'characters' },
  技能: { type: 'skills', route: 'characters' },
  知识卡: { type: 'cards', route: 'cards' },
  道具: { type: 'items', route: 'items' },
  衍生物: { type: 'entities', route: 'entities' },
  状态: { type: 'buffs', route: 'buffs' },
  地图: { type: 'maps', route: 'maps' },
  组件: { type: 'fixtures', route: 'fixtures' },
  模式: { type: 'modes', route: 'modes' },
  特性: { type: 'traits', route: 'mechanics/traitCollection' },
  组合: { type: 'itemGroups', route: 'itemGroups' },
  猫特技: { type: 'specialSkills', route: 'special-skills/cat', factionId: 'cat' },
  鼠特技: { type: 'specialSkills', route: 'special-skills/mouse', factionId: 'mouse' },
  猫成就: { type: 'achievements', route: 'achievements/cat', factionId: 'cat' },
  鼠成就: { type: 'achievements', route: 'achievements/mouse', factionId: 'mouse' },
} as const;

export type ChatReferenceLabel = keyof typeof REFERENCE_DOMAINS;
export const CHAT_REFERENCE_LABELS = Object.keys(REFERENCE_DOMAINS) as ChatReferenceLabel[];
export type ChatReference = {
  key: string;
  label: ChatReferenceLabel;
  id: string;
  name: string;
  aliases: readonly string[];
  href: string;
  imageUrl?: string;
};
export type ChatReferenceMatch = { reference: ChatReference; start: number; end: number };

export const referenceToken = (reference: Pick<ChatReference, 'label' | 'id'>) =>
  `@${reference.label}「${reference.id}」`;

function makeReference(label: ChatReferenceLabel, id: string, value?: unknown): ChatReference {
  const entry = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const route = REFERENCE_DOMAINS[label].route;
  const separator = id.indexOf('/');
  const characterId = id.slice(0, separator);
  const skillName = id.slice(separator + 1);
  return {
    key: `${label}:${id}`,
    label,
    id,
    name:
      label === '技能' && separator > 0
        ? `${characterId} · ${skillName}`
        : typeof entry.name === 'string'
          ? entry.name
          : typeof entry.id === 'string'
            ? entry.id
            : id,
    aliases: Array.isArray(entry.aliases)
      ? entry.aliases.filter((alias): alias is string => typeof alias === 'string')
      : [],
    href:
      label === '特性'
        ? `/${route}/`
        : label === '技能' && separator > 0
          ? `/${route}/${encodeURIComponent(characterId)}/#${encodeURIComponent(`Skill:${skillName}`)}`
          : `/${route}/${encodeURIComponent(id)}/`,
    ...(typeof entry.imageUrl === 'string' ? { imageUrl: entry.imageUrl } : {}),
  };
}

function referenceSource(
  label: ChatReferenceLabel,
  data: PublishedGameDataByType,
  itemGroups: Readonly<Record<string, ItemGroup>>
) {
  const domain = REFERENCE_DOMAINS[label];
  if (domain.type === 'skills') {
    return Object.fromEntries(
      Object.entries(data.characters ?? {}).flatMap(([characterId, character]) =>
        (character.skills ?? []).map(
          (skill) => [`${characterId}/${skill.name}`, { ...skill, characterId }] as const
        )
      )
    );
  }
  if (domain.type === 'itemGroups') return itemGroups;
  if ('factionId' in domain) return data[domain.type]?.[domain.factionId];
  return data[domain.type];
}

export function buildChatReferenceCatalog(
  data: PublishedGameDataByType,
  itemGroups: Readonly<Record<string, ItemGroup>> = {}
): ChatReference[] {
  return CHAT_REFERENCE_LABELS.flatMap((label) =>
    Object.entries(referenceSource(label, data, itemGroups) ?? {}).map(([id, value]) =>
      makeReference(label, id, value)
    )
  );
}

export function extractChatReferences(text: string): ChatReferenceMatch[] {
  const pattern = new RegExp(
    `@(${CHAT_REFERENCE_LABELS.join('|')})「([^「」\\r\\n]{1,128})」`,
    'gu'
  );
  return Array.from(text.matchAll(pattern), (match) => ({
    reference: makeReference(match[1] as ChatReferenceLabel, match[2]!),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

/** Resolve identifiers against published data. Never accept client-supplied facts or URLs. */
export function resolveChatReferences(
  text: string,
  data: PublishedGameDataByType,
  itemGroups: Readonly<Record<string, ItemGroup>>
) {
  const unique = new Map<string, ChatReference>();
  for (const { reference } of extractChatReferences(text)) {
    unique.delete(reference.key);
    unique.set(reference.key, reference);
  }
  return [...unique.values()].slice(-24).map((reference) => {
    const source = referenceSource(reference.label, data, itemGroups);
    return {
      label: reference.label,
      id: reference.id,
      type: REFERENCE_DOMAINS[reference.label].type,
      data: source && Object.hasOwn(source, reference.id) ? source[reference.id] : null,
    };
  });
}

const pinyinCache = new Map<string, string>();
export async function searchChatReferences(
  catalog: readonly ChatReference[],
  query: string,
  label?: ChatReferenceLabel
): Promise<ChatReference[]> {
  const normalized = query.toLowerCase().replace(/[\s']/g, '');
  const candidates = label ? catalog.filter((item) => item.label === label) : catalog;
  if (!normalized) return candidates.slice(0, 8);
  const scores = await Promise.all(
    candidates.map(async (item) => {
      const terms = [item.id, item.name, ...item.aliases].map((term) => term.toLowerCase());
      let score = terms.some((term) => term === normalized)
        ? 100
        : terms.some((term) => term.startsWith(normalized))
          ? 80
          : terms.some((term) => term.includes(normalized))
            ? 60
            : item.label.includes(normalized)
              ? 10
              : 0;
      if (!score && /^[a-z]+$/.test(normalized)) {
        for (const term of terms) {
          let pinyin = pinyinCache.get(term);
          if (pinyin === undefined) {
            pinyin = await convertToPinyin(term);
            pinyinCache.set(term, pinyin);
          }
          if (pinyin.includes(normalized)) {
            score = 40;
            break;
          }
        }
      }
      return { item, score };
    })
  );
  return scores
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => item);
}
