import { autoWrapNames } from '@/data/autoWrapNames';
import type { ActorProfile } from '@/features/actor-profiles/schema';
import { getActorJumpHeight, getActorProfile } from '@/features/actor-profiles/selectors';
import { characters } from '@/data';

import type { CharacterRecord } from './types';

type AutoWrapNameMatcher = {
  regex: RegExp | null;
  priorities: ReadonlyMap<string, number>;
};

type AutoWrapCandidate = {
  name: string;
  start: number;
  end: number;
  priority: number;
};

type CanonicalCharacterExpression = (role: ActorProfile, character: CharacterRecord) => unknown;

const CANONICAL_CHARACTER_EXPRESSIONS: Readonly<Record<string, CanonicalCharacterExpression>> = {
  maxHp: (role) => role.maxHp,
  attackBoost: (role) => role.attack,
  hpRecovery: (role) => role.hpRecovery,
  moveSpeed: (role) => role.runSpeed,
  jumpHeight: (role) => getActorJumpHeight(role),
  clawKnifeCdHit: (role) => role.attackCooldown.hit,
  clawKnifeCdUnhit: (role) => role.attackCooldown.miss,
  clawKnifeRange: (role) => role.attackRange,
  initialItem: (role) => role.initialItem,
  storePurchaseTime: (role) => role.shoppingDelay,
  cheesePushSpeed: (role) => role.pushCheeseSpeed,
  wallCrackDamageBoost: (role, character) =>
    character.factionId === 'mouse' ? role.wallDamage : undefined,
  gender: (role) => (role.sex === 'none' ? undefined : role.sex),
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createAutoWrapNameMatcher = (names: readonly string[]): AutoWrapNameMatcher => {
  const uniqueNames: string[] = [];
  const priorities = new Map<string, number>();

  names.forEach((name) => {
    if (!name || priorities.has(name)) return;
    priorities.set(name, uniqueNames.length);
    uniqueNames.push(name);
  });

  if (uniqueNames.length === 0) {
    return { regex: null, priorities };
  }

  return {
    regex: new RegExp(uniqueNames.map(escapeRegExp).join('|'), 'y'),
    priorities,
  };
};

const defaultAutoWrapNameMatcher = createAutoWrapNameMatcher(autoWrapNames);

const rangesOverlap = (
  left: Pick<AutoWrapCandidate, 'start' | 'end'>,
  right: Pick<AutoWrapCandidate, 'start' | 'end'>
): boolean => left.start < right.end && left.end > right.start;

const collectAutoWrapCandidates = (
  text: string,
  matcher: AutoWrapNameMatcher
): AutoWrapCandidate[] => {
  if (!matcher.regex) return [];

  const candidates: AutoWrapCandidate[] = [];

  for (let index = 0; index < text.length; index++) {
    matcher.regex.lastIndex = index;
    const match = matcher.regex.exec(text);
    const name = match?.[0];
    if (!name) continue;

    candidates.push({
      name,
      start: index,
      end: index + name.length,
      priority: matcher.priorities.get(name) ?? Number.MAX_SAFE_INTEGER,
    });
  }

  return candidates;
};

const wrapAutoNamesWithMatcher = (
  text: string,
  matcher: AutoWrapNameMatcher,
  currentCharacterNames: ReadonlySet<string>
): string => {
  const candidates = collectAutoWrapCandidates(text, matcher).sort(
    (a, b) => a.priority - b.priority || a.start - b.start
  );

  const processedRanges: Array<Pick<AutoWrapCandidate, 'start' | 'end'>> = [];
  const selectedCandidates: AutoWrapCandidate[] = [];

  candidates.forEach((candidate) => {
    if (processedRanges.some((range) => rangesOverlap(candidate, range))) {
      return;
    }

    processedRanges.push(candidate);

    if (!currentCharacterNames.has(candidate.name)) {
      selectedCandidates.push(candidate);
    }
  });

  if (selectedCandidates.length === 0) {
    return text;
  }

  selectedCandidates.sort((a, b) => a.start - b.start);

  let result = '';
  let lastIndex = 0;

  selectedCandidates.forEach((candidate) => {
    result += text.slice(lastIndex, candidate.start);
    result += `{${candidate.name}}`;
    lastIndex = candidate.end;
  });

  return result + text.slice(lastIndex);
};

export const wrapAutoNamesInText = (
  text: string,
  names: readonly string[],
  currentCharacterNames: ReadonlySet<string>
): string =>
  wrapAutoNamesWithMatcher(text, createAutoWrapNameMatcher(names), currentCharacterNames);

export const resolveCharacterExpression = (
  expr: string,
  character?: CharacterRecord
): unknown | undefined => {
  if (!character) return undefined;
  const trimmed = expr.trim().replace(/^:/, '');
  if (!/^[\w.$[\]]+$/.test(trimmed)) return undefined;

  const tokens: Array<string | number> = [];
  const pathPattern = /([^.[\]]+)|(\[(\d+)\])/g;
  let match: RegExpExecArray | null;

  while ((match = pathPattern.exec(trimmed)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else if (match[3]) tokens.push(Number(match[3]));
  }

  const [firstToken, ...remainingTokens] = tokens;
  const canonicalExpression =
    typeof firstToken === 'string' ? CANONICAL_CHARACTER_EXPRESSIONS[firstToken] : undefined;
  let current: unknown;
  if (canonicalExpression) {
    current = canonicalExpression(getActorProfile(character.id), character);
  } else {
    current = character;
    remainingTokens.unshift(firstToken!);
  }

  for (const key of remainingTokens) {
    if (current == null || (typeof current !== 'object' && typeof current !== 'function')) {
      return undefined;
    }
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
};

export function preprocessText(text: string, currentCharacterName?: string | undefined): string {
  if (text.includes('{') || text.includes('}') || text.includes('《') || text.includes('》')) {
    return text;
  }

  const currentCharacter = currentCharacterName ? characters[currentCharacterName] : undefined;
  const currentCharacterNames = new Set(
    [currentCharacterName, currentCharacter?.id, ...(currentCharacter?.aliases ?? [])].filter(
      (name): name is string => typeof name === 'string' && name.length > 0
    )
  );

  return wrapAutoNamesWithMatcher(text, defaultAutoWrapNameMatcher, currentCharacterNames);
}
