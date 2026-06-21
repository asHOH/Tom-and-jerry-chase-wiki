/**
 * Skill effect extraction and anonymization for the Guess Character game.
 *
 * Extracts skill descriptions, strips wiki markup, and replaces identifying
 * names (skill names, character names) with placeholders while preserving
 * the numerical/mechanical details that serve as clues.
 */
import type { Buff } from '@/data/types';

// Use a more permissive type that accepts both readonly (Valtio snapshot) and mutable records
type CharacterLike = {
  id: string;
  aliases?: readonly string[] | string[];
  skills?: readonly {
    name: string;
    aliases?: readonly string[] | string[];
    type: string;
    description?: string;
    detailedDescription?: string;
    skillLevels?: readonly {
      level: number;
      description?: string;
      detailedDescription?: string;
      cooldown?: number;
    }[];
  }[];
  gender?: 'male' | 'female' | undefined;
};

/** A single anonymized skill clue */
export type SkillClue = {
  /** Index of this skill in the character's skill array (0-based) */
  skillIndex: number;
  /** Anonymized effect text for display */
  anonymizedText: string;
  /** Map from placeholder → real name (for debugging / admin display) */
  placeholderMap: Record<string, string>;
};

/**
 * Extract all character names from the character data record.
 * Used to detect character references in skill descriptions.
 */
function getAllCharacterNames(characters: Record<string, CharacterLike>): Set<string> {
  const names = new Set<string>();
  for (const char of Object.values(characters)) {
    names.add(char.id);
    if (char.aliases) {
      for (const alias of char.aliases) {
        names.add(alias);
      }
    }
  }
  return names;
}

/**
 * Normalize a name for comparison: strip parenthetical suffixes like "(衍生物)".
 */
function normalizeName(name: string): string {
  return name.replace(/\([^)]*\)/g, '').trim();
}

const SKILL_PLACEHOLDER_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const OTHER_CHAR_LETTERS = '甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥';

/**
 * Build anonymized skill clues for a character.
 *
 * For each skill (sorted: active → weapon1 → weapon2 → passive):
 *   1. Takes the `detailedDescription` (falling back to `description`)
 *   2. Strips `{...}` wiki markup (keeps the inner text)
 *   3. Replaces skill names → [技能A], character name → [该角色],
 *      other character names → [其他角色甲], etc.
 *
 * @param character - The target character (with enriched fields from GameDataManager)
 * @param allCharacters - Full character record for detecting cross-references
 * @returns SkillClue[] — one per skill
 */
export function buildSkillCluesForCharacter(
  character: CharacterLike,
  allCharacters: Record<string, CharacterLike>,
  _allBuffs: Record<string, Buff>
): SkillClue[] {
  const skills = character.skills;
  if (!skills || skills.length === 0) return [];

  const allCharNames = getAllCharacterNames(allCharacters);
  const clues: SkillClue[] = [];

  // Sort skills: active, weapon1, weapon2, passive
  const skillOrder: Record<string, number> = {
    active: 0,
    weapon1: 1,
    weapon2: 2,
    passive: 3,
  };
  const sorted = [...skills].sort((a, b) => (skillOrder[a.type] ?? 9) - (skillOrder[b.type] ?? 9));

  for (let i = 0; i < sorted.length; i++) {
    const skill = sorted[i]!;
    const placeholderMap: Record<string, string> = {};

    // Get the richest description available
    let text = skill.detailedDescription || skill.description || '';
    if (!text.trim()) {
      // Try the first skill level with a non-empty description
      for (const level of skill.skillLevels ?? []) {
        const levelText = level.detailedDescription || level.description || '';
        if (levelText.trim()) {
          text = levelText;
          break;
        }
      }
    }
    if (!text.trim()) continue; // Skip skills with no description

    // Step 1: Strip wiki markup {name} → name
    let processed = text.replace(/\{([^}]+)\}/g, '$1');

    // Step 2: Build replacement map
    const skillPlaceholder = `[技能${SKILL_PLACEHOLDER_LETTERS[i]}]`;
    placeholderMap[skillPlaceholder] = skill.name;

    // Step 3: Replace the skill's own name and its normalized form
    const escapedSkillName = escapeRegex(skill.name);

    // Replace full skill name references
    processed = processed.replace(new RegExp(escapedSkillName, 'g'), skillPlaceholder);

    // Also replace the skill's aliases if any
    if (skill.aliases) {
      for (const alias of skill.aliases) {
        if (alias && alias.length > 0) {
          processed = processed.replace(new RegExp(escapeRegex(alias), 'g'), skillPlaceholder);
        }
      }
    }

    // Step 4: Replace the character's own name
    const charPlaceholder = '[该角色]';
    placeholderMap[charPlaceholder] = character.id;
    processed = processed.replace(new RegExp(escapeRegex(character.id), 'g'), charPlaceholder);
    // Also replace normalized form (in case used without parenthetical)
    const normalizedCharName = normalizeName(character.id);
    if (normalizedCharName !== character.id) {
      processed = processed.replace(new RegExp(escapeRegex(normalizedCharName), 'g'), '[该角色]');
    }
    // Replace character aliases
    if (character.aliases) {
      for (const alias of character.aliases) {
        if (alias && alias.length > 0) {
          processed = processed.replace(new RegExp(escapeRegex(alias), 'g'), charPlaceholder);
        }
      }
    }

    // Step 5: Replace other character names with [其他角色X]
    let otherCharIndex = 0;
    const otherCharMap = new Map<string, string>();

    for (const name of allCharNames) {
      if (
        name === character.id ||
        name === normalizedCharName ||
        name === skill.name ||
        character.aliases?.includes(name) ||
        skill.aliases?.includes(name)
      ) {
        continue; // Already handled above
      }
      if (processed.includes(name)) {
        let placeholder = otherCharMap.get(name);
        if (!placeholder) {
          placeholder = `[其他角色${OTHER_CHAR_LETTERS[otherCharIndex] ?? '?'}]`;
          otherCharMap.set(name, placeholder);
          otherCharIndex++;
        }
        processed = processed.replace(new RegExp(escapeRegex(name), 'g'), placeholder);
        placeholderMap[placeholder] = name;
      }
    }

    // Step 6: Clean up excessive whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    clues.push({
      skillIndex: i,
      anonymizedText: processed,
      placeholderMap,
    });
  }

  return clues;
}

/** Escape special regex characters in a string. */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
