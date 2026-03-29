import { autoWrapNames } from '@/data/autoWrapNames';
import { FactionId, SingleItem, SingleItemTypeName } from '@/data/types';
import {
  achievements,
  buffs,
  cards,
  characters,
  entities,
  fixtures,
  itemGroups,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

import { compareSingleItem } from './singleItemTools';

// Define return type interface
interface ReverseResultItem {
  name: string;
  type: SingleItemTypeName;
  factionId?: FactionId;
  description: string;
}

// Chinese type names mapping
const CHINESE_TYPE_NAME_MAP: Record<SingleItemTypeName, string[]> = {
  character: ['猫角色', '鼠角色', '角色'],
  knowledgeCard: ['知识卡', '猫知识卡', '鼠知识卡'],
  specialSkill: ['特技', '猫特技', '鼠特技'],
  item: ['道具'],
  entity: ['衍生物', '猫衍生物', '鼠衍生物'],
  buff: ['状态'],
  map: ['地图'],
  fixture: ['地图组件', '场景物'],
  mode: ['游戏模式', '模式'],
  achievement: ['对局成就'],
  skill: ['技能'],
};

// Function to get appropriate Chinese type names based on type and factionId
function getChineseTypeNames(type: SingleItemTypeName, factionId?: FactionId): string[] {
  const baseNames = CHINESE_TYPE_NAME_MAP[type] || [];

  // If factionId is undefined, return all names
  if (factionId === undefined) {
    return baseNames;
  }

  // If factionId is defined, return:
  // 1. Overall type names (without faction prefix)
  // 2. Names matching this faction only
  const faction = factionId === 'cat' ? '猫' : '鼠';

  return baseNames.filter((name) => {
    // Include if it doesn't have faction prefix (overall name)
    if (!name.includes('猫') && !name.includes('鼠')) {
      return true;
    }
    // Include if it matches the current faction
    if (name.includes(faction)) {
      return true;
    }
    return false;
  });
}

// Updated addBracket function to include Chinese type names
export function addBracket(
  strings: string[],
  type?: SingleItemTypeName,
  factionId?: FactionId
): string[] {
  return strings.flatMap((item) => {
    const baseBrackets = [`{${item}}`, `《${item}》`];

    // If type is provided, add brackets with Chinese type names
    if (type) {
      const chineseTypeNames = getChineseTypeNames(type, factionId);
      const typeBrackets = chineseTypeNames.flatMap((chineseType) => [
        `{${item}(${chineseType})}`,
        `《${item}(${chineseType})》`,
      ]);
      return [...baseBrackets, ...typeBrackets];
    }

    return baseBrackets;
  });
}

// Helper function to clean text by limiting consecutive newlines
function cleanTextNewlines(text: string, maxConsecutiveNewlines: number = 1): string {
  if (!text) return text;

  // Replace multiple consecutive newlines with at most maxConsecutiveNewlines
  const newlinePattern = new RegExp(`\\n{${maxConsecutiveNewlines + 1},}`, 'g');
  const replacement = '\n'.repeat(maxConsecutiveNewlines);

  return text.replace(newlinePattern, replacement);
}

// Helper function to extract description with keyword context
// Extracts characters around the first occurrence of keyword with new limits:
// - On mobile: at most 10 characters before the keyword
// - On desktop: at most 30 characters before the keyword
// - Always at most 100 characters after the keyword
function extractDescriptionWithContext(
  text: string,
  keywords: string[],
  isMobile: boolean,
  maxAfterLength: number = 100
): string {
  // Set max before length based on device type
  const maxBeforeLength = isMobile ? 10 : 30;

  if (!text || !keywords.length) {
    const cleanedText = cleanTextNewlines(text);
    // If no keywords, return a reasonable length
    const totalLength = maxBeforeLength + maxAfterLength;
    return cleanedText.length > totalLength
      ? cleanedText.substring(0, totalLength) + '...'
      : cleanedText;
  }

  // Clean the text first to limit consecutive newlines
  const cleanedText = cleanTextNewlines(text);

  // Find first occurrence of any keyword
  let firstIndex = -1;
  let matchedKeyword = '';
  let matchedKeywordLength = 0;

  for (const keyword of keywords) {
    if (!keyword || keyword.length === 0) continue;

    // Check for keyword without brackets
    const index = cleanedText.indexOf(keyword);
    if (index !== -1 && (firstIndex === -1 || index < firstIndex)) {
      firstIndex = index;
      matchedKeyword = keyword;
      matchedKeywordLength = keyword.length;
    }

    // Also check for bracketed versions
    const bracketedVersions = [`{${keyword}}`, `《${keyword}》`];
    for (const bracketed of bracketedVersions) {
      const bracketedIndex = cleanedText.indexOf(bracketed);
      if (bracketedIndex !== -1 && (firstIndex === -1 || bracketedIndex < firstIndex)) {
        firstIndex = bracketedIndex;
        matchedKeyword = bracketed;
        matchedKeywordLength = bracketed.length;
      }
    }
  }

  if (firstIndex === -1) {
    // If no keyword found, return the beginning of the text
    const totalLength = maxBeforeLength + maxAfterLength;
    return cleanedText.length > totalLength
      ? cleanedText.substring(0, totalLength) + '...'
      : cleanedText;
  }

  // Calculate start position: at most maxBeforeLength characters before the keyword
  let start = Math.max(0, firstIndex - maxBeforeLength);

  // Calculate end position: at most maxAfterLength characters after the keyword
  let end = Math.min(cleanedText.length, firstIndex + matchedKeywordLength + maxAfterLength);

  // Ensure we include the entire keyword
  if (start > firstIndex) {
    start = firstIndex;
  }
  if (end < firstIndex + matchedKeywordLength) {
    end = Math.min(cleanedText.length, firstIndex + matchedKeywordLength + maxAfterLength);
  }

  // Extract substring
  let result = cleanedText.substring(start, end);

  // Ensure keyword is not preceded by too many newlines (at most 1)
  const keywordInResultIndex = result.indexOf(matchedKeyword);
  if (keywordInResultIndex !== -1) {
    // Check text before the keyword in the result
    const beforeKeyword = result.substring(0, keywordInResultIndex);

    // Count newlines before keyword
    const newlineCount = (beforeKeyword.match(/\n/g) || []).length;

    if (newlineCount > 1) {
      // Too many newlines before keyword, adjust the start position
      // Find the first newline that still shows the keyword
      let adjustedStart = start;
      let foundGoodPosition = false;

      // Search backward from the keyword position in original text
      for (let i = firstIndex - 1; i >= Math.max(0, firstIndex - maxBeforeLength); i--) {
        if (cleanedText.charAt(i) === '\n') {
          // Check if this is the first newline we encounter going backwards
          // We want the text after this newline (i+1)
          adjustedStart = i + 1;
          foundGoodPosition = true;
          break;
        }
      }

      if (foundGoodPosition) {
        // Recalculate result with adjusted start
        result = cleanedText.substring(adjustedStart, end);
      } else {
        // If no newline found within the allowed range, start at the keyword
        result = cleanedText.substring(firstIndex, end);
      }
    }
  }

  // Add ellipsis if needed
  if (start > 0) {
    result = '...' + result;
  }
  if (end < cleanedText.length) {
    result = result + '...';
  }

  return result;
}

// Interface for categorized keywords
export interface CategorizedKeywords {
  originalKeywords: string[]; // 原名
  aliasKeywords: string[]; // 别名
  groupKeywords: string[]; // 组合名
  allKeywords: string[]; // 所有关键词合并
}

// Helper function to get all reverse strings for highlighting
export function getCategorizedKeywords(singleItem: SingleItem): CategorizedKeywords {
  const getSingleItemAliases = (singleItem: SingleItem): string[] => {
    let R: string[] | undefined;
    if (singleItem.type == 'character') {
      R = characters[singleItem.name]?.aliases;
    } else if (singleItem.type == 'knowledgeCard') {
      R = cards[singleItem.name]?.aliases;
    } else if (singleItem.type == 'specialSkill') {
      if (['应急治疗', '急速翻滚'].includes(singleItem.name)) {
        const factionId: FactionId = singleItem.factionId || 'mouse';
        R =
          factionId === 'cat'
            ? Object.values(specialSkills.cat).find(
                (specialSkill) => specialSkill.name === singleItem.name
              )?.aliases
            : Object.values(specialSkills.mouse).find(
                (specialSkill) => specialSkill.name === singleItem.name
              )?.aliases;
      } else {
        const allSpecialSkills = Object.values({ ...specialSkills.cat, ...specialSkills.mouse });
        R = allSpecialSkills.find((specialSkill) => specialSkill.name === singleItem.name)?.aliases;
      }
    } else if (singleItem.type == 'item') {
      R = items[singleItem.name]?.aliases;
    } else if (singleItem.type == 'entity') {
      R = entities[singleItem.name]?.aliases;
    } else if (singleItem.type == 'buff') {
      R = buffs[singleItem.name]?.aliases;
    } else if (singleItem.type == 'map') {
      R = maps[singleItem.name]?.aliases;
    } else if (singleItem.type == 'fixture') {
      R = fixtures[singleItem.name]?.aliases;
    } else if (singleItem.type == 'mode') {
      R = modes[singleItem.name]?.aliases;
    } else if (singleItem.type == 'achievement') {
      R = achievements[singleItem.name]?.aliases;
    } else if (singleItem.type == 'skill') {
      const skill = Object.values(characters)
        .flatMap((c) => c.skills)
        .find((skill) => skill.name === singleItem.name);
      R = skill?.aliases;
    }

    return R || [];
  };

  // 【修复关键】正确获取组合名：仅从itemGroups数据源获取
  const groupNames = Object.values(itemGroups)
    .filter((itemGroup) => itemGroup.group.some((item) => compareSingleItem(item, singleItem)))
    .flatMap((itemGroup) => [itemGroup.name, ...(itemGroup.aliases || [])]);

  // Get original name keywords
  let originalKeywords: string[] = [];
  if (autoWrapNames.some((string) => singleItem.name.includes(string))) {
    originalKeywords = [singleItem.name];
  } else {
    originalKeywords = addBracket([singleItem.name], singleItem.type, singleItem.factionId);
  }

  // Get alias keywords
  const aliases = getSingleItemAliases(singleItem);
  const aliasKeywords = addBracket(aliases, singleItem.type, singleItem.factionId);

  // 【修复关键】直接使用从数据源获取的组合名，不进行任何启发式过滤
  const groupKeywordBrackets = addBracket(groupNames); // 注意：这里不传递type参数

  // Build all keywords (including name, aliases, and group keywords)
  const allKeywords: string[] = [...originalKeywords, ...aliasKeywords, ...groupKeywordBrackets];

  return {
    originalKeywords,
    aliasKeywords,
    groupKeywords: groupKeywordBrackets,
    allKeywords,
  };
}

export default function singleItemRreverse(
  singleItem: SingleItem,
  isMobile: boolean = false
): ReverseResultItem[] {
  const { allKeywords } = getCategorizedKeywords(singleItem);

  // Helper function to find description with keyword context for a single item
  const findDescriptionWithKeyword = (
    descriptionFields: (string | null | undefined)[],
    keywords: string[]
  ): string => {
    // Filter out null/undefined and empty strings, then join with space
    const validTexts = descriptionFields.filter((d): d is string => d != null && d.trim() !== '');

    if (validTexts.length === 0) {
      return ''; // Return empty string if no description available
    }

    // Try to find the first text containing any keyword
    for (const text of validTexts) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return extractDescriptionWithContext(text, keywords, isMobile);
        }
      }
    }

    // If no keyword found in any text, return the first non-empty description
    // Clean it first to limit newlines
    const firstText = cleanTextNewlines(validTexts[0] || '');
    const maxBeforeLength = isMobile ? 10 : 30;
    const maxAfterLength = 100;
    const totalLength = maxBeforeLength + maxAfterLength;
    return firstText.length > totalLength ? firstText.substring(0, totalLength) + '...' : firstText;
  };

  const SkillResult = Object.values(characters)
    .flatMap((c) => c.skills)
    .filter((a) => {
      return [
        a.description,
        a.detailedDescription,
        ...a.skillLevels.flatMap((l) => [l.description, l.detailedDescription]),
      ]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [
          a.description,
          a.detailedDescription,
          ...a.skillLevels.flatMap((l) => [l.description, l.detailedDescription]),
        ],
        allKeywords
      );
      return { name: a.name, type: 'skill', description };
    });

  const CardResult = Object.values(cards)
    .filter((a) => {
      return [a?.description, a?.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.id || '', type: 'knowledgeCard', description };
    });

  const SpecialSkillResult = [
    ...Object.values(specialSkills.cat)
      .filter((a) => {
        return [a.description, a.detailedDescription]
          .filter((d): d is string => d != null)
          .some((d) => allKeywords.some((string) => d.includes(string)));
      })
      .map((a): ReverseResultItem => {
        const description = findDescriptionWithKeyword(
          [a.description, a.detailedDescription],
          allKeywords
        );
        return { name: a.name, type: 'specialSkill', factionId: 'cat', description };
      }),
    ...Object.values(specialSkills.mouse)
      .filter((a) => {
        return [a.description, a.detailedDescription]
          .filter((d): d is string => d != null)
          .some((d) => allKeywords.some((string) => d.includes(string)));
      })
      .map((a): ReverseResultItem => {
        const description = findDescriptionWithKeyword(
          [a.description, a.detailedDescription],
          allKeywords
        );
        return { name: a.name, type: 'specialSkill', factionId: 'mouse', description };
      }),
  ];

  const ItemResult = Object.values(items)
    .filter((a) => {
      return [a?.description, a?.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.name || '', type: 'item', description };
    });

  const EntityResult = Object.values(entities)
    .filter((a) => {
      return [a.description, a.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a.description, a.detailedDescription],
        allKeywords
      );
      return { name: a.name, type: 'entity', description };
    });

  const BuffResult = Object.values(buffs)
    .filter((a) => {
      return [a?.description, a?.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.name || '', type: 'buff', description };
    });

  const MapResult = Object.values(maps)
    .filter((a) => {
      return [a?.description, a?.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.name || '', type: 'map', description };
    });

  const ModeResult = Object.values(modes)
    .filter((a) => {
      return [a?.description, a?.detailedDescription, a?.rules, a?.detailedRules]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.name || '', type: 'mode', description };
    });

  const FixtureResult = Object.values(fixtures)
    .filter((a) => {
      return [a?.description, a?.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.name || '', type: 'fixture', description };
    });

  const AchievementResult = Object.values(achievements)
    .filter((a) => {
      return [a?.description, a?.detailedDescription]
        .filter((d): d is string => d != null)
        .some((d) => allKeywords.some((string) => d.includes(string)));
    })
    .map((a): ReverseResultItem => {
      const description = findDescriptionWithKeyword(
        [a?.description, a?.detailedDescription].filter((d): d is string => d != null),
        allKeywords
      );
      return { name: a?.name || '', type: 'achievement', description };
    });

  const Result = [
    ...SkillResult,
    ...CardResult,
    ...SpecialSkillResult,
    ...ItemResult,
    ...EntityResult,
    ...BuffResult,
    ...MapResult,
    ...ModeResult,
    ...FixtureResult,
    ...AchievementResult,
  ];

  // Remove the input singleItem from results if present
  const index = Result.findIndex(
    (item) =>
      item.name === singleItem.name &&
      item.type === singleItem.type &&
      item.factionId === singleItem.factionId
  );
  if (index > -1) Result.splice(index, 1);

  return Result;
}
