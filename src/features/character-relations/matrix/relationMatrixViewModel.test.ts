import { cards, specialSkills } from '@/data/static';
import { characterRelationsEdit, characters } from '@/data/store';
import type { CharacterRelation, CharacterRelationItem, TraitRelationKind } from '@/data/types';
import {
  removeCharacterRelationItemFromKinds,
  upsertCharacterRelationItem,
} from '@/features/characters/utils/characterRelationOverlay';

import {
  buildRelationMatrixViewModel,
  coerceColumnCategory,
  getLegalColumnCategories,
  getRelationMatrixCell,
} from './relationMatrixViewModel';

const findEntityKey = (entities: readonly { id: string; key: string }[], id: string): string => {
  const entity = entities.find((item) => item.id === id);
  if (!entity) throw new Error(`Missing matrix entity ${id}`);
  return entity.key;
};

const getCell = (
  viewModel: ReturnType<typeof buildRelationMatrixViewModel>,
  rowId: string,
  columnId: string
) =>
  getRelationMatrixCell(
    viewModel,
    findEntityKey(viewModel.rows, rowId),
    findEntityKey(viewModel.columns, columnId)
  );

const cloneCharacters = () => structuredClone(characters);

const restoreCharacters = (snapshot: Record<string, unknown>) => {
  Object.keys(characters).forEach((key) => {
    delete (characters as Record<string, unknown>)[key];
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    (characters as Record<string, unknown>)[key] = structuredClone(value);
  });
};

const setRelationItems = (
  characterId: string,
  relationKind: TraitRelationKind,
  items: CharacterRelationItem[]
) => {
  (characters[characterId] as Partial<CharacterRelation>)[relationKind] = items;
};

describe('relationMatrixViewModel', () => {
  let snapshot: Record<string, unknown>;
  let relationSnapshot: Record<string, unknown>;

  beforeEach(() => {
    snapshot = cloneCharacters() as Record<string, unknown>;
    relationSnapshot = structuredClone(characterRelationsEdit) as Record<string, unknown>;
  });

  afterEach(() => {
    restoreCharacters(snapshot);
    Object.keys(characterRelationsEdit).forEach((key) => delete characterRelationsEdit[key]);
    Object.entries(relationSnapshot).forEach(([key, value]) => {
      (characterRelationsEdit as Record<string, unknown>)[key] = structuredClone(value);
    });
  });

  it('should expose legal column categories and coerce illegal selections', () => {
    expect(getLegalColumnCategories('mouse').map((option) => option.id)).toEqual([
      'mouse',
      'cat',
      'knowledgeCard',
      'specialSkill',
      'map',
      'mode',
    ]);
    expect(getLegalColumnCategories('cat').map((option) => option.id)).toEqual([
      'mouse',
      'knowledgeCard',
      'specialSkill',
      'map',
      'mode',
    ]);
    expect(coerceColumnCategory('cat', 'cat')).toBe('mouse');
    expect(coerceColumnCategory('mouse', 'cat')).toBe('cat');
  });

  it('should default to mouse rows and cat character columns', () => {
    const viewModel = buildRelationMatrixViewModel();

    expect(viewModel.rowFaction).toBe('mouse');
    expect(viewModel.columnCategory).toBe('cat');
    expect(viewModel.rows[0]?.id).toBe('杰瑞');
    expect(viewModel.columns[0]?.id).toBe('汤姆');
  });

  it('should resolve mouse collaborator cells symmetrically', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'mouse',
    });

    expect(getCell(viewModel, '鲍姆', '剑客莉莉')).toMatchObject({
      displayKind: 'collaborator',
      isMinor: false,
      tooltipContent: expect.stringContaining('协作：鲍姆救援后自保差不好走'),
    });
    expect(getCell(viewModel, '剑客莉莉', '鲍姆')).toMatchObject({
      displayKind: 'collaborator',
      isMinor: false,
    });
  });

  it('should resolve character counter, countered-by, and mutual counter cells', () => {
    const catRows = buildRelationMatrixViewModel({
      rowFaction: 'cat',
      columnCategory: 'mouse',
    });
    const mouseRows = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    expect(getCell(catRows, '汤姆', '杰瑞')).toMatchObject({
      displayKind: 'counter',
      tooltipContent: expect.stringContaining('克制：杰瑞自保能力差'),
    });
    expect(getCell(mouseRows, '杰瑞', '汤姆')).toMatchObject({
      displayKind: 'counteredBy',
      tooltipContent: expect.stringContaining('被克制：杰瑞自保能力差'),
    });
    expect(getCell(catRows, '牛仔汤姆', '剑客泰菲')).toMatchObject({
      displayKind: 'counteredBy',
    });
    expect(getCell(mouseRows, '剑客泰菲', '牛仔汤姆')).toMatchObject({
      displayKind: 'counter',
    });
    expect(getCell(mouseRows, '鲍姆', '图茨')).toMatchObject({
      displayKind: 'counterEachOther',
      tooltipContent: expect.stringContaining('互克：鲍姆爆炸会打断喵喵叫'),
    });
  });

  it('should filter knowledge-card and special-skill targets to the opposite faction', () => {
    const mouseKnowledgeCards = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'knowledgeCard',
    });
    const catKnowledgeCards = buildRelationMatrixViewModel({
      rowFaction: 'cat',
      columnCategory: 'knowledgeCard',
    });
    const mouseSpecialSkills = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'specialSkill',
    });
    const catSpecialSkills = buildRelationMatrixViewModel({
      rowFaction: 'cat',
      columnCategory: 'specialSkill',
    });

    expect(
      mouseKnowledgeCards.columns.every((column) => cards[column.id]?.factionId === 'cat')
    ).toBe(true);
    expect(
      catKnowledgeCards.columns.every((column) => cards[column.id]?.factionId === 'mouse')
    ).toBe(true);
    expect(
      mouseSpecialSkills.columns.every((column) => specialSkills.cat[column.id] !== undefined)
    ).toBe(true);
    expect(
      catSpecialSkills.columns.every((column) => specialSkills.mouse[column.id] !== undefined)
    ).toBe(true);

    expect(getCell(mouseKnowledgeCards, '恶魔泰菲', '皮糙肉厚')).toMatchObject({
      displayKind: 'counter',
    });
    expect(getCell(mouseSpecialSkills, '泰菲', '我生气了！')).toMatchObject({
      displayKind: 'counter',
    });
  });

  it('should map advantage and disadvantage maps and modes into display relation kinds', () => {
    const catMaps = buildRelationMatrixViewModel({ rowFaction: 'cat', columnCategory: 'map' });
    const catModes = buildRelationMatrixViewModel({ rowFaction: 'cat', columnCategory: 'mode' });

    expect(getCell(catMaps, '塔拉', '经典之家I')).toMatchObject({
      displayKind: 'counter',
    });
    expect(getCell(catMaps, '塔拉', '雪夜古堡III')).toMatchObject({
      displayKind: 'counteredBy',
    });
    expect(getCell(catModes, '斯飞', '疯狂奶酪赛')).toMatchObject({
      displayKind: 'counter',
    });
    expect(getCell(catModes, '斯飞', '黄金钥匙赛')).toMatchObject({
      displayKind: 'counteredBy',
    });
  });

  it('should preserve minor relation marker data', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    expect(getCell(viewModel, '鲍姆', '托普斯')).toMatchObject({
      displayKind: 'counterEachOther',
      isMinor: true,
    });
  });

  it('should display relation edits from the canonical characterRelations store', () => {
    const beforeOverlay = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });
    const emptyColumn = beforeOverlay.columns.find(
      (column) =>
        !getRelationMatrixCell(beforeOverlay, findEntityKey(beforeOverlay.rows, '杰瑞'), column.key)
    );

    if (!emptyColumn) throw new Error('Expected at least one empty cat column for 杰瑞');

    upsertCharacterRelationItem('杰瑞', 'counters', {
      id: emptyColumn.id,
      description: '规范关系修改',
      isMinor: true,
    });

    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    expect(getCell(viewModel, '杰瑞', emptyColumn.id)).toMatchObject({
      displayKind: 'counter',
      sourceKind: 'counters',
      description: '规范关系修改',
      tooltipContent: '克制：规范关系修改',
      isMinor: true,
    });
  });

  it('should hide relations removed from the canonical characterRelations store', () => {
    const baseline = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });
    expect(getCell(baseline, '杰瑞', '汤姆')).toBeDefined();

    removeCharacterRelationItemFromKinds('杰瑞', ['counteredBy'], '汤姆');

    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    expect(getCell(viewModel, '杰瑞', '汤姆')).toBeUndefined();
  });

  it('should ignore stale Character relation fields in favor of canonical relation cells', () => {
    setRelationItems('侦探杰瑞', 'counterEachOther', [
      {
        id: '兔八哥',
        description: 'stale mutual counter overlay',
        isMinor: true,
      },
    ]);

    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    expect(getCell(viewModel, '侦探杰瑞', '兔八哥')).toMatchObject({
      sourceKind: 'counters',
    });
  });

  it('should keep the first row-local matrix cell when duplicate cells leak through', () => {
    const firstItem = {
      id: '汤姆',
      description: 'first duplicate',
      isMinor: false,
    };
    const duplicateItem = {
      id: '汤姆',
      description: 'duplicate',
      isMinor: true,
    };

    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
      getRelationsForRow: () =>
        ({
          counters: [firstItem, duplicateItem],
          counteredBy: [],
          counterEachOther: [],
          collaborators: [],
          countersKnowledgeCards: [],
          counteredByKnowledgeCards: [],
          countersSpecialSkills: [],
          counteredBySpecialSkills: [],
          advantageMaps: [],
          advantageModes: [],
          disadvantageMaps: [],
          disadvantageModes: [],
        }) satisfies CharacterRelation,
    });

    expect(getCell(viewModel, '杰瑞', '汤姆')).toMatchObject({
      description: 'first duplicate',
      isMinor: false,
      sourceKind: 'counters',
    });
  });
});
