import type { FactionId, PositioningTag } from '@/data/types';

import type { QuizOption } from '../data/catQuestions';

/** User's accumulated tag profile (tag name → total weight) */
export type TagProfile = Record<string, number>;

/** A matched character with similarity score */
export type MatchedCharacter = {
  characterId: string;
  score: number;
};

/**
 * Build a user tag profile from their quiz answers.
 * Sums the weights of each tag selected across all answers.
 */
export function buildUserProfile(answers: QuizOption[]): TagProfile {
  const profile: TagProfile = {};
  for (const answer of answers) {
    for (const { tagName, weight } of answer.tags) {
      profile[tagName] = (profile[tagName] ?? 0) + weight;
    }
  }
  return profile;
}

/**
 * Build a character's tag profile from their positioning tags.
 * Major tags get weight 2, minor tags get weight 1.
 */
function buildCharacterTagProfile(
  positioningTags: readonly PositioningTag[] | undefined
): TagProfile {
  const profile: TagProfile = {};
  if (!positioningTags) return profile;
  for (const tag of positioningTags) {
    const weight = tag.isMinor ? 1 : 2;
    profile[tag.tagName] = (profile[tag.tagName] ?? 0) + weight;
  }
  return profile;
}

/**
 * Compute weighted Jaccard similarity between two tag profiles.
 *
 * weighted Jaccard = Σ min(userWeight, charWeight) / Σ max(userWeight, charWeight)
 * Ranges from 0 (no overlap) to 1 (identical profiles).
 */
function weightedJaccardSimilarity(a: TagProfile, b: TagProfile): number {
  const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (allKeys.size === 0) return 0;

  let numerator = 0;
  let denominator = 0;

  for (const key of allKeys) {
    const aVal = a[key] ?? 0;
    const bVal = b[key] ?? 0;
    numerator += Math.min(aVal, bVal);
    denominator += Math.max(aVal, bVal);
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Find the closest character matches for a given tag profile and faction.
 *
 * @param userProfile - The user's accumulated tag profile from quiz answers
 * @param factionId - 'cat' or 'mouse'
 * @param allCharacters - Full character record
 * @returns Top 3 matches sorted by similarity score (descending)
 */
export function findClosestCharacters(
  userProfile: TagProfile,
  factionId: FactionId,
  allCharacters: Record<
    string,
    {
      id: string;
      factionId?: FactionId;
      catPositioningTags?: readonly PositioningTag[];
      mousePositioningTags?: readonly PositioningTag[];
    }
  >
): MatchedCharacter[] {
  const candidates: MatchedCharacter[] = [];

  for (const char of Object.values(allCharacters)) {
    if (char.factionId !== factionId) continue;

    const charTags = factionId === 'cat' ? char.catPositioningTags : char.mousePositioningTags;
    const charProfile = buildCharacterTagProfile(charTags);

    const score = weightedJaccardSimilarity(userProfile, charProfile);

    // Boost score slightly for characters with more matching tags
    // to break ties meaningfully
    const adjustedScore = score > 0 ? score : 0;

    candidates.push({ characterId: char.id, score: adjustedScore });
  }

  // Sort by score descending, break ties by character ID for determinism
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.characterId.localeCompare(b.characterId);
  });

  return candidates.slice(0, 3);
}

/**
 * Generate share text for the quiz result.
 */
export function generateQuizShareText(
  faction: string,
  characterName: string,
  similarCharacters: string[]
): string {
  const similar = similarCharacters.length > 0 ? `\n近似角色：${similarCharacters.join('、')}` : '';

  return [
    `猫鼠人格测试`,
    ``,
    `我（${faction}）的本命角色是：${characterName}${similar}`,
    ``,
    '来测测你的：tjwiki.com/games/playstyle-quiz/',
  ].join('\n');
}
