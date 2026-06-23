import { characterRelationTraits } from '@/data/characterRelations';
import { cards, maps, modes, specialSkills } from '@/data/static';
import type { FactionId, SingleItem, Trait, TraitRelationKind } from '@/data/types';
import { catCharacterIds, mouseCharacterIds } from '@/features/characters/data/characterMetadata';

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
  traits?: readonly Trait[];
};

type ProjectedRelationCell = RelationMatrixCell & {
  rowItem: SingleItem;
  columnItem: SingleItem;
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

const getInverseDisplayKind = (
  displayKind: RelationMatrixDisplayKind
): RelationMatrixDisplayKind => {
  switch (displayKind) {
    case 'collaborator':
    case 'counterEachOther':
      return displayKind;
    case 'counter':
      return 'counteredBy';
    case 'counteredBy':
      return 'counter';
  }
};

const createCell = (trait: Trait, displayKind: RelationMatrixDisplayKind): RelationMatrixCell => {
  const relation = trait.relation;
  if (!relation) {
    throw new Error('Relation matrix traits must include relation metadata.');
  }

  const description = relation.description ?? trait.description;

  return {
    displayKind,
    isMinor: !!relation.isMinor,
    description,
    tooltipContent: `${TOOLTIP_PREFIX_BY_DISPLAY_KIND[displayKind]}${description}`,
    sourceKind: relation.kind,
  };
};

const projectTraitToCells = (trait: Trait): ProjectedRelationCell[] => {
  const relation = trait.relation;
  if (!relation || relation.subject.type !== 'character') return [];

  const displayKind = getDisplayKind(relation.kind);
  const forwardCell = {
    ...createCell(trait, displayKind),
    rowItem: relation.subject,
    columnItem: relation.target,
  };

  if (relation.target.type !== 'character') {
    return [forwardCell];
  }

  return [
    forwardCell,
    {
      ...createCell(trait, getInverseDisplayKind(displayKind)),
      rowItem: relation.target,
      columnItem: relation.subject,
    },
  ];
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
  const rowKeys = new Set(rows.map((row) => row.key));
  const columnKeys = new Set(columns.map((column) => column.key));
  const cells = new Map<string, RelationMatrixCell>();

  for (const trait of options.traits ?? characterRelationTraits) {
    for (const projectedCell of projectTraitToCells(trait)) {
      const rowItemKey = toItemKey(projectedCell.rowItem);
      const columnItemKey = toItemKey(projectedCell.columnItem);
      if (!rowKeys.has(rowItemKey) || !columnKeys.has(columnItemKey)) continue;

      const cellKey = toCellKey(rowItemKey, columnItemKey);
      if (cells.has(cellKey)) {
        throw new Error(`Duplicate relation matrix cell: ${cellKey}`);
      }

      const { rowItem: _rowItem, columnItem: _columnItem, ...cell } = projectedCell;
      cells.set(cellKey, cell);
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
