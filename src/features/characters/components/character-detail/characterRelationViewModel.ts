import { cards } from '@/data/static';
import type { CharacterRelationItem, FactionId, TraitRelationKind } from '@/data/types';

type RelationItemOptions = {
  relationKind: TraitRelationKind;
  isEditable: boolean;
  getDescriptionPath?: (index: number, id: string) => string | undefined;
  onToggleMinor?: (id: string) => void;
  onRemove?: (id: string) => void;
  onUpdateDescription?: (id: string, description: string) => void;
};

type RelationDisplayBase = {
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  isEditable: boolean;
  descriptionPath?: string;
  relationKind: TraitRelationKind;
  onToggleMinor?: () => void;
  getToggleLabel?: (currentIsMinor: boolean) => string;
  onRemove?: () => void;
  onUpdateDescription?: (description: string) => void;
};

export type CharacterDisplayItem = RelationDisplayBase & {
  type: 'character';
  imageSrc: string;
  getAriaLabel: (isEditMode: boolean) => string;
  onNavigate: () => void;
};

export type KnowledgeCardDisplayItem = RelationDisplayBase & {
  type: 'knowledgeCard';
  imageUrl: string;
  ariaLabel: string;
  onNavigate: () => void;
};

export type SpecialSkillDisplayItem = RelationDisplayBase & {
  type: 'specialSkill';
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
};

export type MapDisplayItem = RelationDisplayBase & {
  type: 'map';
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
};

export type ModeDisplayItem = RelationDisplayBase & {
  type: 'mode';
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
};

export type RelationDisplayItem =
  | CharacterDisplayItem
  | KnowledgeCardDisplayItem
  | SpecialSkillDisplayItem
  | MapDisplayItem
  | ModeDisplayItem;

const toArray = <T>(value: readonly T[] | undefined | null): T[] =>
  value ? Array.from(value) : [];

const optionalRelationActions = (
  itemId: string,
  options: RelationItemOptions,
  descriptionPath?: string
) => ({
  ...(descriptionPath ? { descriptionPath } : {}),
  ...(options.onToggleMinor ? { onToggleMinor: () => options.onToggleMinor?.(itemId) } : {}),
  ...(options.onRemove ? { onRemove: () => options.onRemove?.(itemId) } : {}),
  ...(options.onUpdateDescription
    ? {
        onUpdateDescription: (description: string) =>
          options.onUpdateDescription?.(itemId, description),
      }
    : {}),
});

export const sortByImportance = <T extends { isMinor?: boolean }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const aMinor = !!a.isMinor;
    const bMinor = !!b.isMinor;
    if (aMinor === bMinor) return 0;
    return aMinor ? 1 : -1;
  });

export const buildCharacterItems = (
  combined: readonly CharacterRelationItem[],
  getImageUrl: (id: string) => string,
  handleSelectCharacter: (id: string) => void,
  ariaLabels: { view: (id: string) => string; edit: (id: string) => string },
  options: RelationItemOptions
): CharacterDisplayItem[] => {
  return combined.map((item, index) => {
    const id = item.id;
    const descriptionPath = options.getDescriptionPath?.(index, id);
    return {
      type: 'character',
      key: `character-${id}`,
      id,
      description: item.description ?? '',
      isMinor: !!item.isMinor,
      imageSrc: getImageUrl(id),
      getAriaLabel: (isEditMode) => (isEditMode ? ariaLabels.edit(id) : ariaLabels.view(id)),
      onNavigate: () => handleSelectCharacter(id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...optionalRelationActions(id, options, descriptionPath),
      getToggleLabel: (currentIsMinor) => `切换${id}的关系为${currentIsMinor ? '主要' : '次要'}`,
    } satisfies CharacterDisplayItem;
  });
};

export const buildKnowledgeCardItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToCard: (id: string) => void,
  options: RelationItemOptions
): KnowledgeCardDisplayItem[] =>
  toArray(items)
    .map((card, index) => {
      const cardObj = cards[card.id];
      if (!cardObj) return null;
      const descriptionPath = options.getDescriptionPath?.(index, card.id);
      return {
        type: 'knowledgeCard',
        key: `knowledgeCard-${card.id}`,
        id: card.id,
        description: card.description ?? '',
        isMinor: !!card.isMinor,
        imageUrl: cardObj.imageUrl,
        ariaLabel: `跳转到知识卡 ${card.id}`,
        onNavigate: () => navigateToCard(card.id),
        isEditable: options.isEditable,
        relationKind: options.relationKind,
        ...optionalRelationActions(card.id, options, descriptionPath),
        getToggleLabel: (currentIsMinor) =>
          `切换${card.id}的知识卡关系为${currentIsMinor ? '主要' : '次要'}`,
      } satisfies KnowledgeCardDisplayItem;
    })
    .filter(Boolean) as KnowledgeCardDisplayItem[];

export const buildSpecialSkillItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToSkill: (id: string) => void,
  targetFaction: FactionId,
  specialSkillsData: Record<FactionId, Record<string, { imageUrl?: string }>>,
  options: RelationItemOptions
): SpecialSkillDisplayItem[] =>
  toArray(items).map((skill, index) => {
    const skillObj = specialSkillsData[targetFaction]?.[skill.id];
    const descriptionPath = options.getDescriptionPath?.(index, skill.id);
    return {
      type: 'specialSkill',
      key: `specialSkill-${skill.id}`,
      id: skill.id,
      description: skill.description ?? '',
      isMinor: !!skill.isMinor,
      ...(skillObj?.imageUrl ? { imageUrl: skillObj.imageUrl } : {}),
      ariaLabel: `跳转到特技 ${skill.id}`,
      onNavigate: () => navigateToSkill(skill.id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...optionalRelationActions(skill.id, options, descriptionPath),
      getToggleLabel: (currentIsMinor) =>
        `切换${skill.id}的特技关系为${currentIsMinor ? '主要' : '次要'}`,
    } satisfies SpecialSkillDisplayItem;
  });

export const buildMapItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToMap: (id: string) => void,
  mapsData: Record<string, { imageUrl?: string }>,
  options: RelationItemOptions
): MapDisplayItem[] =>
  toArray(items).map((map, index) => {
    const mapObj = mapsData[map.id];
    const descriptionPath = options.getDescriptionPath?.(index, map.id);
    return {
      type: 'map',
      key: `map-${map.id}`,
      id: map.id,
      description: map.description ?? '',
      isMinor: !!map.isMinor,
      ...(mapObj?.imageUrl ? { imageUrl: mapObj.imageUrl } : {}),
      ariaLabel: `跳转到地图 ${map.id}`,
      onNavigate: () => navigateToMap(map.id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...optionalRelationActions(map.id, options, descriptionPath),
      getToggleLabel: (currentIsMinor) =>
        `切换${map.id}的地图关系为${currentIsMinor ? '主要' : '次要'}`,
    } satisfies MapDisplayItem;
  });

export const buildModeItems = (
  items: readonly CharacterRelationItem[] | undefined,
  navigateToMode: (id: string) => void,
  modesData: Record<string, { imageUrl?: string }>,
  options: RelationItemOptions
): ModeDisplayItem[] =>
  toArray(items).map((mode, index) => {
    const modeObj = modesData[mode.id];
    const descriptionPath = options.getDescriptionPath?.(index, mode.id);
    return {
      type: 'mode',
      key: `mode-${mode.id}`,
      id: mode.id,
      description: mode.description ?? '',
      isMinor: !!mode.isMinor,
      ...(modeObj?.imageUrl ? { imageUrl: modeObj.imageUrl } : {}),
      ariaLabel: `跳转到模式 ${mode.id}`,
      onNavigate: () => navigateToMode(mode.id),
      isEditable: options.isEditable,
      relationKind: options.relationKind,
      ...optionalRelationActions(mode.id, options, descriptionPath),
      getToggleLabel: (currentIsMinor) =>
        `切换${mode.id}的模式关系为${currentIsMinor ? '主要' : '次要'}`,
    } satisfies ModeDisplayItem;
  });
