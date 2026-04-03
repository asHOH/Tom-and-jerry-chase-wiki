/**
 * EchoFlow Path-Data Resolvers
 *
 * Maps URL paths to corresponding data fetch functions.
 * Provides a unified interface for the EchoFlow API to access game data.
 */

import {
  getApprovedArticleVersion,
  getArticleBasicInfo,
  getArticlesPageData,
} from '@/lib/articles/serverQueries';
import { GameDataManager } from '@/lib/dataManager';
import characterRelations from '@/data/characterRelations';
import { contributors } from '@/data/contributors';
import { historyData } from '@/data/history';
import traits from '@/data/traits';
import { wikiHistoryData } from '@/data/wikiHistory';
import { winRatesData } from '@/data/winRates';
import { getCharacterRelation } from '@/features/characters/utils/relations';
import {
  achievements,
  buffs,
  cards,
  entities,
  fixtures,
  itemGroups,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

import { WikiChangeType } from '@/data/types';

let updateLookup: Map<string, { date: string; description?: string }> | null = null;

function getUpdateLookup(): Map<string, { date: string; description?: string }> {
  if (updateLookup) return updateLookup;
  
  updateLookup = new Map();
  for (const yearData of wikiHistoryData) {
    for (const event of yearData.events) {
      const changes = event.details.data?.changes || [];
      const batchChanges = event.details.data?.batchChanges || [];
      const allChanges = [
        ...changes.map(c => ({ change: c, date: `${yearData.year}.${event.date.split('-')[0]}` })),
        ...batchChanges.flatMap(batch =>
          batch.changes.map(c => ({ change: c, date: `${yearData.year}.${event.date.split('-')[0]}` }))
        ),
      ];
      for (const { change, date } of allChanges) {
        if (change.changeType === WikiChangeType.UPDATE && !updateLookup.has(change.item.name)) {
          updateLookup.set(change.item.name, { date, description: change.description });
        }
      }
    }
  }
  return updateLookup;
}

function getItemUpdateTime(itemName: string): { date: string; description?: string } | undefined {
  return getUpdateLookup().get(itemName);
}

export type ResolverResult = {
  data: unknown;
  meta: {
    type: string;
    count?: number;
    path: string;
    hasDetail: boolean;
    updatedAt?: string;
  };
};

export type FullDataResult = {
  data: unknown;
  meta: {
    type: string;
    count: number;
    path: string;
    updatedAt: string;
  };
};

export type PathResolver = {
  description: string;
  list: () => Promise<ResolverResult> | ResolverResult;
  detail?: (id: string) => Promise<ResolverResult | null> | ResolverResult | null;
  fullData?: () => Promise<FullDataResult> | FullDataResult;
};

function recordToArray<T extends object>(
  record: Record<string, T>,
  keyName: string = 'name'
): Array<T & { [key: string]: string }> {
  return Object.entries(record).map(([key, value]) => ({
    ...value,
    [keyName]: key,
  }));
}

function findByKey<T>(record: Record<string, T>, key: string): (T & { name: string }) | null {
  const decodedKey = decodeURIComponent(key);
  const item = record[decodedKey];
  if (!item) return null;
  return { ...item, name: decodedKey };
}

function createListResult(
  data: unknown[],
  type: string,
  path: string,
  hasDetail: boolean = false
): ResolverResult {
  return {
    data,
    meta: {
      type,
      count: data.length,
      path,
      hasDetail,
    },
  };
}

function createDetailResult(data: unknown, type: string, path: string, updatedAt?: string): ResolverResult {
  return {
    data,
    meta: {
      type,
      path,
      hasDetail: true,
      ...(updatedAt && { updatedAt }),
    },
  };
}

function createFullDataResult(
  data: unknown,
  type: string,
  path: string,
  updatedAt?: string
): FullDataResult {
  return {
    data,
    meta: {
      type,
      count: Array.isArray(data) ? data.length : 1,
      path,
      updatedAt: updatedAt || new Date().toISOString(),
    },
  };
}

export const resolvers: Record<string, PathResolver> = {
  characters: {
    description: '游戏角色列表（猫和老鼠）',
    list: () => {
      const charactersRecord = GameDataManager.getCharacters();
      const charactersList = recordToArray(charactersRecord, 'id');
      return createListResult(charactersList, 'Character', '/characters', true);
    },
    detail: (id: string) => {
      const charactersRecord = GameDataManager.getCharacters();
      const decodedId = decodeURIComponent(id);
      const character = charactersRecord[decodedId];
      if (!character) return null;

      const relations = getCharacterRelation(decodedId);
      const updateInfo = getItemUpdateTime(decodedId);

      return createDetailResult(
        {
          ...character,
          id: decodedId,
          relations:
            relations.counters.length > 0 ||
            relations.counteredBy.length > 0 ||
            relations.counterEachOther.length > 0 ||
            relations.collaborators.length > 0 ||
            relations.countersKnowledgeCards.length > 0 ||
            relations.counteredByKnowledgeCards.length > 0 ||
            relations.countersSpecialSkills.length > 0 ||
            relations.counteredBySpecialSkills.length > 0 ||
            relations.advantageMaps.length > 0 ||
            relations.advantageModes.length > 0 ||
            relations.disadvantageMaps.length > 0 ||
            relations.disadvantageModes.length > 0
              ? relations
              : undefined,
        },
        'Character',
        `/characters/${id}`,
        updateInfo?.date
      );
    },
    fullData: () => {
      const charactersRecord = GameDataManager.getCharacters();
      const fullCharacters = Object.entries(charactersRecord).map(([id, character]) => {
        const relations = getCharacterRelation(id);
        return {
          ...character,
          id,
          relations:
            relations.counters.length > 0 ||
            relations.counteredBy.length > 0 ||
            relations.counterEachOther.length > 0 ||
            relations.collaborators.length > 0 ||
            relations.countersKnowledgeCards.length > 0 ||
            relations.counteredByKnowledgeCards.length > 0 ||
            relations.countersSpecialSkills.length > 0 ||
            relations.counteredBySpecialSkills.length > 0 ||
            relations.advantageMaps.length > 0 ||
            relations.advantageModes.length > 0 ||
            relations.disadvantageMaps.length > 0 ||
            relations.disadvantageModes.length > 0
              ? relations
              : undefined,
        };
      });
      return createFullDataResult(fullCharacters, 'Character', '/characters');
    },
  },

  cards: {
    description: '知识卡牌列表',
    list: () => {
      const cardsList = recordToArray(cards, 'id');
      return createListResult(cardsList, 'Card', '/cards', true);
    },
    detail: (id: string) => {
      const decodedId = decodeURIComponent(id);
      const card = cards[decodedId];
      if (!card) return null;
      const updateInfo = getItemUpdateTime(decodedId);
      return createDetailResult({ ...card, id: decodedId }, 'Card', `/cards/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullCards = Object.entries(cards).map(([id, card]) => ({ ...card, id }));
      return createFullDataResult(fullCards, 'Card', '/cards');
    },
  },

  items: {
    description: '道具列表',
    list: () => {
      const itemsList = recordToArray(items, 'name');
      return createListResult(itemsList, 'Item', '/items', true);
    },
    detail: (id: string) => {
      const item = findByKey(items, id);
      if (!item) return null;
      const updateInfo = getItemUpdateTime(item.name);
      return createDetailResult(item, 'Item', `/items/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullItems = recordToArray(items, 'name');
      return createFullDataResult(fullItems, 'Item', '/items');
    },
  },

  entities: {
    description: '衍生物/实体列表',
    list: () => {
      const entitiesList = recordToArray(entities, 'name');
      return createListResult(entitiesList, 'Entity', '/entities', true);
    },
    detail: (id: string) => {
      const entity = findByKey(entities, id);
      if (!entity) return null;
      const updateInfo = getItemUpdateTime(entity.name);
      return createDetailResult(entity, 'Entity', `/entities/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullEntities = recordToArray(entities, 'name');
      return createFullDataResult(fullEntities, 'Entity', '/entities');
    },
  },

  buffs: {
    description: '状态效果列表',
    list: () => {
      const buffsList = recordToArray(buffs, 'name');
      return createListResult(buffsList, 'Buff', '/buffs', true);
    },
    detail: (id: string) => {
      const buff = findByKey(buffs, id);
      if (!buff) return null;
      const updateInfo = getItemUpdateTime(buff.name);
      return createDetailResult(buff, 'Buff', `/buffs/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullBuffs = recordToArray(buffs, 'name');
      return createFullDataResult(fullBuffs, 'Buff', '/buffs');
    },
  },

  maps: {
    description: '地图列表',
    list: () => {
      const mapsList = recordToArray(maps, 'name');
      return createListResult(mapsList, 'Map', '/maps', true);
    },
    detail: (id: string) => {
      const map = findByKey(maps, id);
      if (!map) return null;
      const updateInfo = getItemUpdateTime(map.name);
      return createDetailResult(map, 'Map', `/maps/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullMaps = recordToArray(maps, 'name');
      return createFullDataResult(fullMaps, 'Map', '/maps');
    },
  },

  fixtures: {
    description: '地图组件/固定物列表',
    list: () => {
      const fixturesList = recordToArray(fixtures, 'name');
      return createListResult(fixturesList, 'Fixture', '/fixtures', true);
    },
    detail: (id: string) => {
      const fixture = findByKey(fixtures, id);
      if (!fixture) return null;
      const updateInfo = getItemUpdateTime(fixture.name);
      return createDetailResult(fixture, 'Fixture', `/fixtures/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullFixtures = recordToArray(fixtures, 'name');
      return createFullDataResult(fullFixtures, 'Fixture', '/fixtures');
    },
  },

  modes: {
    description: '游戏模式列表',
    list: () => {
      const modesList = recordToArray(modes, 'name');
      return createListResult(modesList, 'Mode', '/modes', true);
    },
    detail: (id: string) => {
      const mode = findByKey(modes, id);
      if (!mode) return null;
      const updateInfo = getItemUpdateTime(mode.name);
      return createDetailResult(mode, 'Mode', `/modes/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullModes = recordToArray(modes, 'name');
      return createFullDataResult(fullModes, 'Mode', '/modes');
    },
  },

  achievements: {
    description: '成就列表',
    list: () => {
      const achievementsList = recordToArray(achievements, 'name');
      return createListResult(achievementsList, 'Achievement', '/achievements', true);
    },
    detail: (id: string) => {
      const achievement = findByKey(achievements, id);
      if (!achievement) return null;
      const updateInfo = getItemUpdateTime(achievement.name);
      return createDetailResult(achievement, 'Achievement', `/achievements/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullAchievements = recordToArray(achievements, 'name');
      return createFullDataResult(fullAchievements, 'Achievement', '/achievements');
    },
  },

  'special-skills': {
    description: '特技列表（猫/鼠阵营）',
    list: () => {
      const catSkillsList = recordToArray(specialSkills.cat, 'name').map((s) => ({
        ...s,
        factionId: 'cat' as const,
      }));
      const mouseSkillsList = recordToArray(specialSkills.mouse, 'name').map((s) => ({
        ...s,
        factionId: 'mouse' as const,
      }));
      const allSkills = [...catSkillsList, ...mouseSkillsList];
      return createListResult(allSkills, 'SpecialSkill', '/special-skills', true);
    },
    detail: (id: string) => {
      const decodedId = decodeURIComponent(id);
      let skill = specialSkills.cat[decodedId];
      let factionId: 'cat' | 'mouse' = 'cat';
      if (!skill) {
        skill = specialSkills.mouse[decodedId];
        factionId = 'mouse';
      }
      if (!skill) return null;
      const updateInfo = getItemUpdateTime(decodedId);
      return createDetailResult(
        { ...skill, name: decodedId, factionId },
        'SpecialSkill',
        `/special-skills/${id}`,
        updateInfo?.date
      );
    },
    fullData: () => {
      const catSkillsList = recordToArray(specialSkills.cat, 'name').map((s) => ({
        ...s,
        factionId: 'cat' as const,
      }));
      const mouseSkillsList = recordToArray(specialSkills.mouse, 'name').map((s) => ({
        ...s,
        factionId: 'mouse' as const,
      }));
      const allSkills = [...catSkillsList, ...mouseSkillsList];
      return createFullDataResult(allSkills, 'SpecialSkill', '/special-skills');
    },
  },

  factions: {
    description: '阵营信息（猫/鼠）及其角色',
    list: () => {
      const characters = GameDataManager.getCharacters();
      const factionsWithCharacters = GameDataManager.getFactionsWithCharacters(characters);
      const factionsList = Object.entries(factionsWithCharacters).map(([id, faction]) => ({
        ...faction,
        id,
      }));
      return createListResult(factionsList, 'Faction', '/factions', true);
    },
    detail: (id: string) => {
      const decodedId = decodeURIComponent(id);
      if (decodedId !== 'cat' && decodedId !== 'mouse') return null;
      const characters = GameDataManager.getCharacters();
      const factionsWithCharacters = GameDataManager.getFactionsWithCharacters(characters);
      const faction = factionsWithCharacters[decodedId];
      if (!faction) return null;
      return createDetailResult({ ...faction, id: decodedId }, 'Faction', `/factions/${id}`);
    },
    fullData: () => {
      const characters = GameDataManager.getCharacters();
      const factionsWithCharacters = GameDataManager.getFactionsWithCharacters(characters);
      const factionsList = Object.entries(factionsWithCharacters).map(([id, faction]) => ({
        ...faction,
        id,
      }));
      return createFullDataResult(factionsList, 'Faction', '/factions');
    },
  },

  itemGroups: {
    description: '道具组合/分类',
    list: () => {
      const groupsList = recordToArray(itemGroups, 'name');
      return createListResult(groupsList, 'ItemGroup', '/itemGroups', true);
    },
    detail: (id: string) => {
      const group = findByKey(itemGroups, id);
      if (!group) return null;
      const updateInfo = getItemUpdateTime(group.name);
      return createDetailResult(group, 'ItemGroup', `/itemGroups/${id}`, updateInfo?.date);
    },
    fullData: () => {
      const fullItemGroups = recordToArray(itemGroups, 'name');
      return createFullDataResult(fullItemGroups, 'ItemGroup', '/itemGroups');
    },
  },

  'win-rates': {
    description: '胜率数据（历史记录）',
    list: () => {
      return createListResult(winRatesData, 'WinRateEntry', '/win-rates', false);
    },
    fullData: () => {
      return createFullDataResult(winRatesData, 'WinRateEntry', '/win-rates');
    },
  },

  ranks: {
    description: '角色定位标签排行',
    list: () => {
      const characters = GameDataManager.getCharacters();
      const rankData = Object.entries(characters).map(([id, char]) => ({
        id,
        name: id,
        factionId: char.faction?.id,
        catPositioningTags: char.catPositioningTags || [],
        mousePositioningTags: char.mousePositioningTags || [],
      }));
      return createListResult(rankData, 'CharacterRank', '/ranks', false);
    },
    fullData: () => {
      const characters = GameDataManager.getCharacters();
      const rankData = Object.entries(characters).map(([id, char]) => ({
        id,
        name: id,
        factionId: char.faction?.id,
        catPositioningTags: char.catPositioningTags || [],
        mousePositioningTags: char.mousePositioningTags || [],
      }));
      return createFullDataResult(rankData, 'CharacterRank', '/ranks');
    },
  },

  recommended: {
    description: '角色推荐信息（关系、地图适配等）',
    list: () => {
      const characters = GameDataManager.getCharacters();
      const recommendedData = Object.entries(characters).map(([id, char]) => {
        const relations = characterRelations[id] || {};
        return {
          id,
          name: id,
          factionId: char.faction?.id,
          description: char.description,
          relations,
        };
      });
      return createListResult(recommendedData, 'RecommendedCharacter', '/recommended', false);
    },
    fullData: () => {
      const characters = GameDataManager.getCharacters();
      const recommendedData = Object.entries(characters).map(([id, char]) => {
        const relations = characterRelations[id] || {};
        return {
          id,
          name: id,
          factionId: char.faction?.id,
          description: char.description,
          relations,
        };
      });
      return createFullDataResult(recommendedData, 'RecommendedCharacter', '/recommended');
    },
  },

  traits: {
    description: '角色特性/机制数据',
    list: () => {
      const traitsList = recordToArray(traits, 'id');
      return createListResult(traitsList, 'Trait', '/traits', false);
    },
    fullData: () => {
      const traitsList = recordToArray(traits, 'id');
      return createFullDataResult(traitsList, 'Trait', '/traits');
    },
  },

  'character-relations': {
    description: '角色关系数据',
    list: () => {
      const relationsList = Object.entries(characterRelations).map(([name, relations]) => ({
        name,
        relations,
      }));
      return createListResult(relationsList, 'CharacterRelation', '/character-relations', false);
    },
    fullData: () => {
      const relationsList = Object.entries(characterRelations).map(([name, relations]) => ({
        name,
        relations,
      }));
      return createFullDataResult(relationsList, 'CharacterRelation', '/character-relations');
    },
  },

  history: {
    description: 'Wiki 编辑历史',
    list: () => {
      return createListResult(historyData, 'HistoryEntry', '/history', false);
    },
    fullData: () => {
      return createFullDataResult(historyData, 'HistoryEntry', '/history');
    },
  },

  'wiki-history': {
    description: 'Wiki 历史数据',
    list: () => {
      return createListResult(wikiHistoryData, 'WikiHistoryEntry', '/wiki-history', false);
    },
    fullData: () => {
      return createFullDataResult(wikiHistoryData, 'WikiHistoryEntry', '/wiki-history');
    },
  },

  contributors: {
    description: 'Wiki 贡献者统计',
    list: () => {
      return createListResult(contributors, 'Contributor', '/contributors', false);
    },
    fullData: () => {
      return createFullDataResult(contributors, 'Contributor', '/contributors');
    },
  },

  articles: {
    description: 'Wiki 文章列表',
    list: async () => {
      const { articles: articlesList } = await getArticlesPageData();
      return createListResult(articlesList, 'Article', '/articles', true);
    },
    detail: async (id: string) => {
      const decodedId = decodeURIComponent(id);
      const [basicInfo, version] = await Promise.all([
        getArticleBasicInfo(decodedId),
        getApprovedArticleVersion({ articleId: decodedId }),
      ]);
      if (!basicInfo) return null;
      return createDetailResult(
        {
          ...basicInfo,
          content: version?.content || null,
          version: version
            ? {
                id: version.id,
                createdAt: version.created_at,
                editorNickname: version.users_public_view?.nickname || null,
              }
            : null,
        },
        'Article',
        `/articles/${id}`
      );
    },
    fullData: async () => {
      const { articles: articlesList } = await getArticlesPageData();
      return createFullDataResult(articlesList, 'Article', '/articles');
    },
  },

  usages: {
    description: '使用指南模块',
    list: () => {
      const usagesMeta = {
        description: '角色使用指南和技巧',
        sections: ['EditPage', 'UsePage'],
        note: '详细内容请访问对应的角色页面',
      };
      return createListResult([usagesMeta], 'UsagesMetadata', '/usages', false);
    },
  },

  mechanics: {
    description: '游戏机制模块',
    list: () => {
      const mechanicsMeta = {
        description: '游戏机制和特性说明',
        sections: ['ArticlesIndex', 'TraitCollection'],
        note: '详细内容请访问机制页面',
      };
      return createListResult([mechanicsMeta], 'MechanicsMetadata', '/mechanics', false);
    },
  },
};

export function getAvailablePaths(): Array<{
  path: string;
  description: string;
  hasDetail: boolean;
  availableDetails?: string[];
}> {
  return Object.entries(resolvers).map(([path, resolver]) => {
    const result: {
      path: string;
      description: string;
      hasDetail: boolean;
      availableDetails?: string[];
    } = {
      path,
      description: resolver.description,
      hasDetail: !!resolver.detail,
    };

    if (resolver.detail) {
      result.availableDetails = getDetailIds(path);
    }

    return result;
  });
}

function getDetailIds(resourcePath: string): string[] {
  try {
    switch (resourcePath) {
      case 'characters': {
        const characters = GameDataManager.getCharacters();
        return Object.keys(characters);
      }
      case 'cards': {
        return Object.keys(cards);
      }
      case 'items': {
        return Object.keys(items);
      }
      case 'entities': {
        return Object.keys(entities);
      }
      case 'buffs': {
        return Object.keys(buffs);
      }
      case 'maps': {
        return Object.keys(maps);
      }
      case 'fixtures': {
        return Object.keys(fixtures);
      }
      case 'modes': {
        return Object.keys(modes);
      }
      case 'achievements': {
        return Object.keys(achievements);
      }
      case 'special-skills': {
        const catSkills = Object.keys(specialSkills.cat);
        const mouseSkills = Object.keys(specialSkills.mouse);
        return [...catSkills, ...mouseSkills];
      }
      case 'factions': {
        return ['cat', 'mouse'];
      }
      case 'itemGroups': {
        return Object.keys(itemGroups);
      }
      case 'ranks': {
        const characters = GameDataManager.getCharacters();
        return Object.keys(characters);
      }
      case 'recommended': {
        const characters = GameDataManager.getCharacters();
        return Object.keys(characters);
      }
      case 'character-relations': {
        return Object.keys(characterRelations);
      }
      case 'traits': {
        return Object.keys(traits);
      }
      default:
        return [];
    }
  } catch {
    return [];
  }
}

export async function resolvePath(
  path: string,
  detailId?: string,
  fullData: boolean = false
): Promise<ResolverResult | FullDataResult | null> {
  const resolver = resolvers[path];
  if (!resolver) return null;

  if (detailId && resolver.detail) {
    const result = resolver.detail(detailId);
    return result instanceof Promise ? await result : result;
  }

  if (fullData && resolver.fullData) {
    const result = resolver.fullData();
    return result instanceof Promise ? await result : result;
  }

  const result = resolver.list();
  return result instanceof Promise ? await result : result;
}
