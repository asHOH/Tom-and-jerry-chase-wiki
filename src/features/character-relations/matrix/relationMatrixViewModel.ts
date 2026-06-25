import { cards, maps, modes, specialSkills } from '@/data/static';
import { characters } from '@/data/store';
import type { CharacterRelation, FactionId, SingleItem, TraitRelationKind } from '@/data/types';
import { catCharacterIds, mouseCharacterIds } from '@/features/characters/data/characterMetadata';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

export type RelationMatrixRowFaction = FactionId;

export type RelationMatrixColumnCategory =
  | FactionId
  | 'knowledgeCard'
  | 'specialSkill'
  | 'map'
  | 'mode';

export type RelationMatrixDisplayKind =
  | 'collaborator'
  | 'counter'
  | 'counteredBy'
  | 'counterEachOther';

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
};

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

const TOOLTIP_PREFIX_BY_DISPLAY_KIND = {
  collaborator: '协作：',
  counter: '克制：',
  counteredBy: '被克制：',
  counterEachOther: '互克：',
} satisfies Record<RelationMatrixDisplayKind, string>;

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

const createCharacterEntities = (factionId: FactionId): RelationMatrixEntity[] => {
  const characterIds = factionId === 'mouse' ? mouseCharacterIds : catCharacterIds;

  return characterIds.map((characterId) =>
    createEntity(
      { name: characterId, type: 'character' },
      `/characters/${encodeURIComponent(characterId)}`
    )
  );
};

const createKnowledgeCardEntities = (factionId: FactionId): RelationMatrixEntity[] =>
  Object.entries(cards)
    .filter(([, card]) => card.factionId === factionId)
    .map(([cardId]) =>
      createEntity(
        { name: cardId, type: 'knowledgeCard', factionId },
        `/cards/${encodeURIComponent(cardId)}`
      )
    );

const createSpecialSkillEntities = (factionId: FactionId): RelationMatrixEntity[] =>
  Object.entries(specialSkills[factionId]).map(([skillId]) =>
    createEntity(
      { name: skillId, type: 'specialSkill', factionId },
      `/special-skills/${factionId}/${encodeURIComponent(skillId)}`
    )
  );

const createMapEntities = (): RelationMatrixEntity[] =>
  Object.keys(maps).map((mapId) =>
    createEntity({ name: mapId, type: 'map' }, `/maps/${encodeURIComponent(mapId)}`)
  );

const createModeEntities = (): RelationMatrixEntity[] =>
  Object.keys(modes).map((modeId) =>
    createEntity({ name: modeId, type: 'mode' }, `/modes/${encodeURIComponent(modeId)}`)
  );

const createColumnEntities = (
  rowFaction: FactionId,
  columnCategory: RelationMatrixColumnCategory
): RelationMatrixEntity[] => {
  switch (columnCategory) {
    case 'mouse':
    case 'cat':
      return createCharacterEntities(columnCategory);
    case 'knowledgeCard':
      return createKnowledgeCardEntities(getOppositeFaction(rowFaction));
    case 'specialSkill':
      return createSpecialSkillEntities(getOppositeFaction(rowFaction));
    case 'map':
      return createMapEntities();
    case 'mode':
      return createModeEntities();
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

const createCell = (
  relationKind: TraitRelationKind,
  item: { description?: string; isMinor?: boolean }
): RelationMatrixCell => {
  const displayKind = getDisplayKind(relationKind);
  const description = item.description ?? '';
  return {
    displayKind,
    isMinor: !!item.isMinor,
    description,
    tooltipContent: `${TOOLTIP_PREFIX_BY_DISPLAY_KIND[displayKind]}${description}`,
    sourceKind: relationKind,
  };
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
  const rowFaction = options.rowFaction ?? DEFAULT_RELATION_MATRIX_ROW_FACTION;
  const columnCategory = coerceColumnCategory(
    rowFaction,
    options.columnCategory ?? DEFAULT_RELATION_MATRIX_COLUMN_CATEGORY
  );
  const rows = createCharacterEntities(rowFaction);
  const columns = createColumnEntities(rowFaction, columnCategory);
  const columnKeyById = new Map(columns.map((column) => [column.id, column.key]));
  const relationKinds = getRelationKindsForColumnCategory(columnCategory);
  const getRelationsForRow =
    options.getRelationsForRow ??
    ((characterId: string) => getCharacterRelation(characters, characterId));
  const cells = new Map<string, RelationMatrixCell>();

  for (const row of rows) {
    const relations = getRelationsForRow(row.id);
    for (const relationKind of relationKinds) {
      for (const item of relations[relationKind]) {
        const columnKey = columnKeyById.get(item.id);
        if (!columnKey) continue;

        const cellKey = toCellKey(row.key, columnKey);
        if (cells.has(cellKey)) {
          throw new Error(`Duplicate relation matrix cell: ${cellKey}`);
        }

        cells.set(cellKey, createCell(relationKind, item));
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
