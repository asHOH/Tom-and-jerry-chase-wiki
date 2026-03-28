import type { FactionId } from '@/data/types';

export const mouseCharacterIds = [
  '杰瑞',
  '侦探杰瑞',
  '罗宾汉杰瑞',
  '航海士杰瑞',
  '国王杰瑞',
  '剑客杰瑞',
  '泰菲',
  '剑客泰菲',
  '牛仔杰瑞',
  '恶魔杰瑞',
  '恶魔泰菲',
  '雪梨',
  '天使杰瑞',
  '天使泰菲',
  '魔术师',
  '佩克斯',
  '拿坡里鼠',
  '侦探泰菲',
  '剑客莉莉',
  '罗宾汉泰菲',
  '玛丽',
  '马索尔',
  '米雪儿',
  '音乐家杰瑞',
  '蒙金奇',
  '尼宝',
  '朵朵',
  '仙女鼠',
  '米可',
  '霜月',
  '表演者•杰瑞',
  '莱恩',
  '梦游杰瑞',
  '鲍姆',
  '朝圣者泰菲',
] as const;

export const catCharacterIds = [
  '汤姆',
  '布奇',
  '托普斯',
  '莱特宁',
  '牛仔汤姆',
  '图多盖洛',
  '侍卫汤姆',
  '图茨',
  '米特',
  '塔拉',
  '剑客汤姆',
  '库博',
  '凯特',
  '苏蕊',
  '天使汤姆',
  '斯飞',
  '恶魔汤姆',
  '兔八哥',
  '追风汤姆',
  '如玉',
] as const;

export const characterDisplayOrder = [...mouseCharacterIds, ...catCharacterIds] as const;

export const characterFactionById = Object.freeze(
  Object.fromEntries([
    ...mouseCharacterIds.map((characterId) => [characterId, 'mouse' as const]),
    ...catCharacterIds.map((characterId) => [characterId, 'cat' as const]),
  ])
) as Readonly<Record<string, FactionId>>;

const characterDisplayRankById = Object.freeze(
  Object.fromEntries(
    characterDisplayOrder.map((characterId, index) => [characterId, index] as const)
  )
) as Readonly<Record<string, number>>;

export const getCharacterFactionById = (characterId: string): FactionId | undefined =>
  characterFactionById[characterId];

export const getCharacterDisplayRankById = (characterId: string): number =>
  characterDisplayRankById[characterId] ?? Number.MAX_SAFE_INTEGER;

export const getCharacterNavigationInfo = (currentCharacterId: string) => {
  const currentIndex = characterDisplayOrder.indexOf(
    currentCharacterId as (typeof characterDisplayOrder)[number]
  );

  return {
    currentIndex,
    previousId: currentIndex > 0 ? characterDisplayOrder[currentIndex - 1] : null,
    nextId:
      currentIndex >= 0 && currentIndex < characterDisplayOrder.length - 1
        ? characterDisplayOrder[currentIndex + 1]
        : null,
    totalCharacters: characterDisplayOrder.length,
  };
};
