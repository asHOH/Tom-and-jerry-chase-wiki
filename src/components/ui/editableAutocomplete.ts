import { requireActiveEditSession } from '@/lib/edit/activeEditSession';
import { CATEGORY_HINTS } from '@/lib/types';

const MAX_AUTOCOMPLETE_ITEMS = 12;

type EditableAutocompleteSource =
  | '角色'
  | '知识卡'
  | '技能'
  | '特技'
  | '道具'
  | '衍生物'
  | '状态'
  | '场景'
  | '地图'
  | '模式'
  | '成就'
  | '分类';

export type EditableAutocompleteCandidate = {
  label: string;
  insertText: string;
  source: EditableAutocompleteSource;
  pinyin: string;
  pinyinInitials: string;
};

let editableAutocompleteCandidatesPromise: Promise<EditableAutocompleteCandidate[]> | null = null;
let pinyinModulePromise: Promise<typeof import('pinyin-pro')> | null = null;

function normalizeAutocompleteInput(input: string): string {
  return input.toLowerCase().replace(/['\s]+/g, '');
}

function getPinyinModule() {
  if (!pinyinModulePromise) {
    pinyinModulePromise = import('pinyin-pro');
  }
  return pinyinModulePromise;
}

async function toPinyinTokens(text: string): Promise<{ full: string; initials: string }> {
  if (!text.trim()) {
    return { full: '', initials: '' };
  }

  const pinyinModule = await getPinyinModule();
  const syllables = pinyinModule.pinyin(text, {
    toneType: 'none',
    v: true,
    type: 'array',
  });

  const normalized = syllables.map((syllable) => normalizeAutocompleteInput(String(syllable)));
  return {
    full: normalized.join(''),
    initials: normalized.map((syllable) => syllable[0] ?? '').join(''),
  };
}

async function buildEditableAutocompleteCandidates(): Promise<EditableAutocompleteCandidate[]> {
  const session = requireActiveEditSession();
  const {
    achievements,
    buffs,
    cards,
    characters,
    entities,
    fixtures,
    items,
    maps,
    modes,
    specialSkills,
  } = {
    achievements: session.readDomain('achievements'),
    buffs: session.readDomain('buffs'),
    cards: session.readDomain('cards'),
    characters: session.readDomain('characters'),
    entities: session.readDomain('entities'),
    fixtures: session.readDomain('fixtures'),
    items: session.readDomain('items'),
    maps: session.readDomain('maps'),
    modes: session.readDomain('modes'),
    specialSkills: session.readDomain('specialSkills'),
  };
  const dedup = new Map<
    string,
    { label: string; insertText: string; source: EditableAutocompleteSource }
  >();

  const add = (value: string | undefined, source: EditableAutocompleteSource) => {
    const normalized = value?.trim();
    if (!normalized || dedup.has(normalized)) {
      return;
    }
    dedup.set(normalized, {
      label: normalized,
      insertText: normalized,
      source,
    });
  };

  const addFromRecord = (record: Record<string, unknown>, source: EditableAutocompleteSource) => {
    Object.entries(record).forEach(([recordKey, rawEntry]) => {
      add(recordKey, source);

      if (!rawEntry || typeof rawEntry !== 'object') {
        return;
      }

      const entry = rawEntry as Record<string, unknown>;
      if (typeof entry.name === 'string') {
        add(entry.name, source);
      }
      if (typeof entry.id === 'string') {
        add(entry.id, source);
      }
    });
  };

  Object.entries(characters).forEach(([name, character]) => {
    add(name, '角色');
    add(character.id, '角色');
    character.skills.forEach((skill) => {
      add(skill.name, '技能');
    });
  });

  Object.entries(cards).forEach(([name, card]) => {
    add(name, '知识卡');
    add(card.id, '知识卡');
  });

  addFromRecord(items as unknown as Record<string, unknown>, '道具');
  addFromRecord(entities as unknown as Record<string, unknown>, '衍生物');
  addFromRecord(buffs as unknown as Record<string, unknown>, '状态');
  addFromRecord(fixtures as unknown as Record<string, unknown>, '场景');
  addFromRecord(maps as unknown as Record<string, unknown>, '地图');
  addFromRecord(modes as unknown as Record<string, unknown>, '模式');
  addFromRecord(achievements.cat as unknown as Record<string, unknown>, '成就');
  addFromRecord(achievements.mouse as unknown as Record<string, unknown>, '成就');
  addFromRecord(specialSkills.cat as unknown as Record<string, unknown>, '特技');
  addFromRecord(specialSkills.mouse as unknown as Record<string, unknown>, '特技');

  CATEGORY_HINTS.forEach((hint) => add(hint, '分类'));

  const candidates = await Promise.all(
    Array.from(dedup.values()).map(async (candidate) => {
      const pinyinTokens = await toPinyinTokens(candidate.label);
      return {
        ...candidate,
        pinyin: pinyinTokens.full,
        pinyinInitials: pinyinTokens.initials,
      };
    })
  );

  return candidates.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
}

export function getEditableAutocompleteCandidates() {
  if (!editableAutocompleteCandidatesPromise) {
    editableAutocompleteCandidatesPromise = buildEditableAutocompleteCandidates();
  }
  return editableAutocompleteCandidatesPromise;
}

export function filterAutocompleteCandidates(
  candidates: EditableAutocompleteCandidate[],
  rawQuery: string
): EditableAutocompleteCandidate[] {
  const normalizedQuery = normalizeAutocompleteInput(rawQuery);
  if (!normalizedQuery) {
    return candidates.slice(0, MAX_AUTOCOMPLETE_ITEMS);
  }

  const scored = candidates
    .map((candidate) => {
      const normalizedLabel = normalizeAutocompleteInput(candidate.label);

      if (normalizedLabel.startsWith(normalizedQuery)) {
        return { candidate, score: 0 };
      }
      if (candidate.pinyin.startsWith(normalizedQuery)) {
        return { candidate, score: 1 };
      }
      if (candidate.pinyinInitials.startsWith(normalizedQuery)) {
        return { candidate, score: 2 };
      }
      if (normalizedLabel.includes(normalizedQuery)) {
        return { candidate, score: 3 };
      }
      if (candidate.pinyin.includes(normalizedQuery)) {
        return { candidate, score: 4 };
      }
      if (candidate.pinyinInitials.includes(normalizedQuery)) {
        return { candidate, score: 5 };
      }

      return null;
    })
    .filter((entry): entry is { candidate: EditableAutocompleteCandidate; score: number } =>
      Boolean(entry)
    )
    .sort((a, b) => {
      if (a.score !== b.score) {
        return a.score - b.score;
      }
      return a.candidate.label.localeCompare(b.candidate.label, 'zh-CN');
    });

  return scored.slice(0, MAX_AUTOCOMPLETE_ITEMS).map((entry) => entry.candidate);
}
