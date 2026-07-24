import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { cards, characters, maps, modes, specialSkills } from '@/data/static';
import type {
  CharacterRelation,
  CharacterRelationTag,
  FactionId,
  SingleItem,
  TraitRelationKind,
} from '@/data/types';
import { catCharacterIds, mouseCharacterIds } from '@/features/characters/data/characterMetadata';
import { getCharacterRelationTagLabels } from '@/features/characters/utils/characterRelationTags';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

export type RelationMatrixRowFaction = FactionId;

export type RelationMatrixColumnCategory =
  FactionId | 'knowledgeCard' | 'specialSkill' | 'map' | 'mode';

export type RelationMatrixDisplayKind =
  'collaborator' | 'counter' | 'counteredBy' | 'counterEachOther';

type RelationMatrixItemType = 'character' | 'knowledgeCard' | 'specialSkill' | 'map' | 'mode';

export type RelationMatrixColumnCategoryOption = {
  id: RelationMatrixColumnCategory;
  label: string;
};

export type RelationMatrixEntity = {
  key: string;
  id: string;
  label: string;
  type: RelationMatrixItemType;
  href: string;
  factionId?: FactionId;
};

export type RelationMatrixCell = {
  displayKind: RelationMatrixDisplayKind;
  isMinor: boolean;
  description: string;
  tooltipContent: string;
  sourceKind: TraitRelationKind;
  tagPairs?: CharacterRelationTag[];
  tagLabels?: string[];
};

export type RelationMatrixViewModel = {
  rowFaction: RelationMatrixRowFaction;
  columnCategory: RelationMatrixColumnCategory;
  columnCategoryOptions: RelationMatrixColumnCategoryOption[];
  rows: RelationMatrixEntity[];
  columns: RelationMatrixEntity[];
  cells: ReadonlyMap<string, RelationMatrixCell>;
};

export type RelationMatrixViewModelOptions = {
  rowFaction?: RelationMatrixRowFaction;
  columnCategory?: RelationMatrixColumnCategory;
  getRelationsForRow?: (characterId: string) => CharacterRelation;
  data?: RelationMatrixData;
};

export type RelationMatrixData = Pick<
  PublishedGameDataByType,
  'characters' | 'cards' | 'specialSkills' | 'maps' | 'modes'
>;

export const DEFAULT_RELATION_MATRIX_ROW_FACTION = 'mouse' satisfies RelationMatrixRowFaction;
export const DEFAULT_RELATION_MATRIX_COLUMN_CATEGORY = 'cat' satisfies RelationMatrixColumnCategory;

const COLUMN_CATEGORY_OPTIONS: readonly RelationMatrixColumnCategoryOption[] = [
  { id: 'mouse', label: '鼠' },
  { id: 'cat', label: '猫' },
  { id: 'knowledgeCard', label: '知识卡' },
  { id: 'specialSkill', label: '特技' },
  { id: 'map', label: '地图' },
  { id: 'mode', label: '模式' },
];

const LEGAL_COLUMN_CATEGORY_IDS_BY_ROW_FACTION: Record<
  RelationMatrixRowFaction,
  readonly RelationMatrixColumnCategory[]
> = {
  mouse: ['mouse', 'cat', 'knowledgeCard', 'specialSkill', 'map', 'mode'],
  cat: ['mouse', 'knowledgeCard', 'specialSkill', 'map', 'mode'],
};

const warnedDuplicateCellKeys = new Set<string>();

const getOppositeFaction = (factionId: FactionId): FactionId =>
  factionId === 'mouse' ? 'cat' : 'mouse';

const toItemKey = (item: SingleItem) => `${item.type}:${item.name}:${item.factionId ?? ''}`;

const toCellKey = (rowItemKey: string, columnItemKey: string) => `${rowItemKey}=>${columnItemKey}`;

const createEntity = (
  item: SingleItem & { type: RelationMatrixItemType },
  href: string
): RelationMatrixEntity => ({
  key: toItemKey(item),
  id: item.name,
  label: item.name,
  type: item.type,
  href,
  ...(item.factionId ? { factionId: item.factionId } : {}),
});

const createCharacterEntities = (
  factionId: FactionId,
  characterData: RelationMatrixData['characters']
): RelationMatrixEntity[] => {
  const canonicalOrder: readonly string[] =
    factionId === 'mouse' ? mouseCharacterIds : catCharacterIds;
  const characterIds = Object.values(characterData)
    .filter((character) => character.factionId === factionId)
    .map((character) => character.id)
    .sort((left, right) => {
      const leftIndex = canonicalOrder.indexOf(left);
      const rightIndex = canonicalOrder.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, 'zh-CN');
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

  return characterIds.map((characterId) =>
    createEntity(
      { name: characterId, type: 'character' },
      `/characters/${encodeURIComponent(characterId)}`
    )
  );
};

const createKnowledgeCardEntities = (
  factionId: FactionId,
  cardData: RelationMatrixData['cards']
): RelationMatrixEntity[] =>
  Object.entries(cardData)
    .filter(([, card]) => card.factionId === factionId)
    .map(([cardId]) =>
      createEntity(
        { name: cardId, type: 'knowledgeCard', factionId },
        `/cards/${encodeURIComponent(cardId)}`
      )
    );

const createSpecialSkillEntities = (
  factionId: FactionId,
  skillData: RelationMatrixData['specialSkills']
): RelationMatrixEntity[] =>
  Object.entries(skillData[factionId]).map(([skillId]) =>
    createEntity(
      { name: skillId, type: 'specialSkill', factionId },
      `/special-skills/${factionId}/${encodeURIComponent(skillId)}`
    )
  );

const createMapEntities = (mapData: RelationMatrixData['maps']): RelationMatrixEntity[] =>
  Object.keys(mapData).map((mapId) =>
    createEntity({ name: mapId, type: 'map' }, `/maps/${encodeURIComponent(mapId)}`)
  );

const createModeEntities = (modeData: RelationMatrixData['modes']): RelationMatrixEntity[] =>
  Object.keys(modeData).map((modeId) =>
    createEntity({ name: modeId, type: 'mode' }, `/modes/${encodeURIComponent(modeId)}`)
  );

const createColumnEntities = (
  rowFaction: FactionId,
  columnCategory: RelationMatrixColumnCategory,
  data: RelationMatrixData
): RelationMatrixEntity[] => {
  switch (columnCategory) {
    case 'mouse':
    case 'cat':
      return createCharacterEntities(columnCategory, data.characters);
    case 'knowledgeCard':
      return createKnowledgeCardEntities(getOppositeFaction(rowFaction), data.cards);
    case 'specialSkill':
      return createSpecialSkillEntities(getOppositeFaction(rowFaction), data.specialSkills);
    case 'map':
      return createMapEntities(data.maps);
    case 'mode':
      return createModeEntities(data.modes);
  }
};

const getDisplayKind = (relationKind: TraitRelationKind): RelationMatrixDisplayKind => {
  switch (relationKind) {
    case 'collaborators':
      return 'collaborator';
    case 'counters':
    case 'countersKnowledgeCards':
    case 'countersSpecialSkills':
    case 'advantageMaps':
    case 'advantageModes':
      return 'counter';
    case 'counteredBy':
    case 'counteredByKnowledgeCards':
    case 'counteredBySpecialSkills':
    case 'disadvantageMaps':
    case 'disadvantageModes':
      return 'counteredBy';
    case 'counterEachOther':
      return 'counterEachOther';
  }
};

const getRelationSentence = (
  relationKind: TraitRelationKind,
  subjectName: string,
  targetName: string
): string => {
  switch (relationKind) {
    case 'counters':
    case 'countersKnowledgeCards':
    case 'countersSpecialSkills':
      return `${subjectName}克制${targetName}`;
    case 'counteredBy':
    case 'counteredByKnowledgeCards':
    case 'counteredBySpecialSkills':
      return `${subjectName}被${targetName}克制`;
    case 'counterEachOther':
      return `${subjectName}与${targetName}互相克制`;
    case 'collaborators':
      return `${subjectName}与${targetName}协作`;
    case 'advantageMaps':
    case 'advantageModes':
      return `${subjectName}在${targetName}中有优势`;
    case 'disadvantageMaps':
    case 'disadvantageModes':
      return `${subjectName}在${targetName}中处于劣势`;
  }
};

const createCell = (
  relationKind: TraitRelationKind,
  subjectName: string,
  targetName: string,
  item: { description?: string; isMinor?: boolean; tags?: CharacterRelationTag[] }
): RelationMatrixCell => {
  const displayKind = getDisplayKind(relationKind);
  const description = item.description ?? '';
  const tagLabels = getCharacterRelationTagLabels(item.tags, relationKind);
  const tagSummary = tagLabels.length > 0 ? ` [${tagLabels.join('、')}]` : '';
  return {
    displayKind,
    isMinor: !!item.isMinor,
    description,
    tooltipContent: `${getRelationSentence(relationKind, subjectName, targetName)}${tagSummary}：${description}`,
    sourceKind: relationKind,
    tagPairs: item.tags?.map((tag) => ({ ...tag })) ?? [],
    tagLabels,
  };
};

const warnDuplicateMatrixCell = (
  cellKey: string,
  oldCell: RelationMatrixCell | undefined,
  newCell: RelationMatrixCell
) => {
  if (process.env.NODE_ENV !== 'development' || warnedDuplicateCellKeys.has(cellKey)) return;
  warnedDuplicateCellKeys.add(cellKey);

  console.warn('[relationMatrixViewModel] Duplicate relation matrix cell ignored.', {
    cellKey,
    oldCell,
    newCell,
  });
};

const getRelationKindsForColumnCategory = (
  columnCategory: RelationMatrixColumnCategory
): readonly TraitRelationKind[] => {
  switch (columnCategory) {
    case 'mouse':
    case 'cat':
      return ['counters', 'counteredBy', 'counterEachOther', 'collaborators'];
    case 'knowledgeCard':
      return ['countersKnowledgeCards', 'counteredByKnowledgeCards'];
    case 'specialSkill':
      return ['countersSpecialSkills', 'counteredBySpecialSkills'];
    case 'map':
      return ['advantageMaps', 'disadvantageMaps'];
    case 'mode':
      return ['advantageModes', 'disadvantageModes'];
  }
};

export const getLegalColumnCategories = (
  rowFaction: RelationMatrixRowFaction
): RelationMatrixColumnCategoryOption[] => {
  const legalCategoryIds = new Set(LEGAL_COLUMN_CATEGORY_IDS_BY_ROW_FACTION[rowFaction]);
  return COLUMN_CATEGORY_OPTIONS.filter((option) => legalCategoryIds.has(option.id));
};

export const coerceColumnCategory = (
  rowFaction: RelationMatrixRowFaction,
  columnCategory: RelationMatrixColumnCategory
): RelationMatrixColumnCategory => {
  if (LEGAL_COLUMN_CATEGORY_IDS_BY_ROW_FACTION[rowFaction].includes(columnCategory)) {
    return columnCategory;
  }

  return getOppositeFaction(rowFaction);
};

export const getRelationMatrixCell = (
  viewModel: RelationMatrixViewModel,
  rowItemKey: string,
  columnItemKey: string
): RelationMatrixCell | undefined => viewModel.cells.get(toCellKey(rowItemKey, columnItemKey));

export const buildRelationMatrixViewModel = (
  options: RelationMatrixViewModelOptions = {}
): RelationMatrixViewModel => {
  const data: RelationMatrixData = options.data ?? {
    characters,
    cards,
    specialSkills,
    maps,
    modes,
  };
  const rowFaction = options.rowFaction ?? DEFAULT_RELATION_MATRIX_ROW_FACTION;
  const columnCategory = coerceColumnCategory(
    rowFaction,
    options.columnCategory ?? DEFAULT_RELATION_MATRIX_COLUMN_CATEGORY
  );
  const rows = createCharacterEntities(rowFaction, data.characters);
  const columns = createColumnEntities(rowFaction, columnCategory, data);
  const columnKeyById = new Map(columns.map((column) => [column.id, column.key]));
  const relationKinds = getRelationKindsForColumnCategory(columnCategory);
  const getRelationsForRow =
    options.getRelationsForRow ??
    ((characterId: string) => getCharacterRelation(data.characters, characterId));
  const cells = new Map<string, RelationMatrixCell>();

  for (const row of rows) {
    const relations = getRelationsForRow(row.id);
    for (const relationKind of relationKinds) {
      for (const item of relations[relationKind]) {
        const columnKey = columnKeyById.get(item.id);
        if (!columnKey) continue;

        const cellKey = toCellKey(row.key, columnKey);
        if (cells.has(cellKey)) {
          warnDuplicateMatrixCell(
            cellKey,
            cells.get(cellKey),
            createCell(relationKind, row.label, item.id, item)
          );
          continue;
        }

        cells.set(cellKey, createCell(relationKind, row.label, item.id, item));
      }
    }
  }

  return {
    rowFaction,
    columnCategory,
    columnCategoryOptions: getLegalColumnCategories(rowFaction),
    rows,
    columns,
    cells,
  };
};
