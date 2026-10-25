import { act, fireEvent, render, screen } from '@testing-library/react';

import { CHARACTER_RELATION_KINDS } from '@/lib/edit/characterRelationActions';
import type { EditSession } from '@/lib/edit/editSession';
import { characters as canonicalCharacters } from '@/data/static';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import RelationMatrixCellEditor from './RelationMatrixCellEditor';

jest.mock('@/components/ui/BaseDialog', () => ({
  BaseDialog: ({ children }: { children: React.ReactNode }) => <div role='dialog'>{children}</div>,
}));

const scope = { kind: 'character-relations' } as const;
let session: EditSession;

function createCharacters() {
  const emptyRelations = () =>
    Object.fromEntries(CHARACTER_RELATION_KINDS.map((kind) => [kind, []]));
  return {
    汤姆: {
      ...structuredClone(canonicalCharacters['汤姆']!),
      ...emptyRelations(),
      counterTags: ['拉扯'],
    },
    杰瑞: {
      ...structuredClone(canonicalCharacters['杰瑞']!),
      ...emptyRelations(),
      counterTags: ['怕拉扯'],
    },
  };
}

function renderEditor(source: '汤姆' | '杰瑞' = '汤姆') {
  const target = source === '汤姆' ? '杰瑞' : '汤姆';
  const kind = source === '汤姆' ? 'counters' : 'counteredBy';
  const item = getCharacterRelation(session.readDomain('characters'), source)[kind].find(
    ({ id }) => id === target
  )!;
  const onOpenChange = jest.fn();
  render(
    <RelationMatrixCellEditor
      open
      selection={{
        row: {
          id: source,
          key: `character:${source}:`,
          label: source,
          type: 'character',
          href: '/characters/汤姆/',
        },
        column: {
          id: target,
          key: `character:${target}:`,
          label: target,
          type: 'character',
          href: '/characters/杰瑞/',
        },
        cell: {
          sourceKind: kind,
          displayKind: kind === 'counters' ? 'counter' : 'counteredBy',
          description: item.description ?? '',
          tooltipContent: '',
          isMinor: !!item.isMinor,
          tagPairs: item.tags ?? [],
        },
      }}
      columnCategory={source === '汤姆' ? 'mouse' : 'cat'}
      onOpenChange={onOpenChange}
      updateCharacters={(mutate) => session.updateDomain('characters', mutate)}
    />
  );
  return onOpenChange;
}

afterEach(() => {
  clearTestEditSession(session);
  window.localStorage.clear();
});

it('keeps an unchanged tag-derived matrix save out of the draft', async () => {
  const characters = createCharacters();
  session = installTestEditSession({ characters });
  const onOpenChange = renderEditor();

  await act(async () => fireEvent.click(screen.getByRole('button', { name: '保存' })));

  expect(onOpenChange).toHaveBeenCalledWith(false);
  expect(session.readDraft(scope)).toEqual({ actionCount: 0, publishEntries: [] });
  expect(session.readDomain('characters')).toEqual(characters);
});

it('preserves different inverse metadata when the selected relation is unchanged', async () => {
  const characters = createCharacters();
  Object.assign(characters.汤姆, {
    counters: [{ id: '杰瑞', description: '汤姆方向的说明', isMinor: false }],
  });
  Object.assign(characters.杰瑞, {
    counteredBy: [{ id: '汤姆', description: '杰瑞方向的说明', isMinor: true }],
  });
  session = installTestEditSession({ characters });
  renderEditor();
  fireEvent.change(screen.getByLabelText(/^说明/), {
    target: { value: '  汤姆方向的说明  ' },
  });
  fireEvent.click(screen.getByRole('button', { name: '添加分类' }));

  await act(async () => fireEvent.click(screen.getByRole('button', { name: '保存' })));

  expect(session.readDraft(scope)).toEqual({ actionCount: 0, publishEntries: [] });
  expect(session.readDomain('characters')).toEqual(characters);
});

it('still records an intentional matrix edit', async () => {
  session = installTestEditSession({ characters: createCharacters() });
  renderEditor();
  fireEvent.change(screen.getByLabelText(/^说明/), { target: { value: '经验证的说明' } });

  await act(async () => fireEvent.click(screen.getByRole('button', { name: '保存' })));

  expect(session.readDraft(scope).actionCount).toBeGreaterThan(0);
  expect(getCharacterRelation(session.readDomain('characters'), '汤姆').counters).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: '杰瑞', description: '经验证的说明' })])
  );
});

it('saves a changed relation kind as one shared record', async () => {
  session = installTestEditSession({ characters: createCharacters() });
  renderEditor('杰瑞');
  fireEvent.change(screen.getByLabelText('关系类型'), { target: { value: 'counterEachOther' } });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '保存' })));

  expect(session.readDraft(scope).publishEntries).toEqual([
    expect.objectContaining({
      path: '杰瑞.characterRelationOverrides.汤姆',
      newValue: expect.objectContaining({ kind: 'counterEachOther' }),
    }),
  ]);
  expect(getCharacterRelation(session.readDomain('characters'), '汤姆').counters).toEqual([]);
  expect(getCharacterRelation(session.readDomain('characters'), '杰瑞').counteredBy).toEqual([]);
  expect(getCharacterRelation(session.readDomain('characters'), '汤姆').counterEachOther).toEqual([
    expect.objectContaining({ id: '杰瑞' }),
  ]);
  expect(getCharacterRelation(session.readDomain('characters'), '杰瑞').counterEachOther).toEqual([
    expect.objectContaining({ id: '汤姆' }),
  ]);
});

it('removes the pair from either matrix direction with one draft action', async () => {
  const characters = createCharacters();
  Object.assign(characters.汤姆, {
    counters: [{ id: '杰瑞', description: 'legacy left', isMinor: false }],
  });
  Object.assign(characters.杰瑞, {
    counteredBy: [{ id: '汤姆', description: 'legacy right', isMinor: true }],
  });
  session = installTestEditSession({ characters });
  renderEditor('杰瑞');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '移除' })));

  expect(session.readDraft(scope).publishEntries).toEqual([
    expect.objectContaining({
      path: '杰瑞.characterRelationOverrides.汤姆',
      newValue: null,
    }),
  ]);
  expect(getCharacterRelation(session.readDomain('characters'), '汤姆').counters).toEqual([]);
  expect(getCharacterRelation(session.readDomain('characters'), '杰瑞').counteredBy).toEqual([]);
});
