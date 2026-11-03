import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { EditSession } from '@/lib/edit/editSession';
import { EditModeContext } from '@/context/EditModeContext';
import { clearTestEditSession, installTestEditSession } from '@/testUtils/editRuntime';

import TraitEditor from './TraitEditor';

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ error: jest.fn(), info: jest.fn() }),
}));

const baseline = {
  original: {
    description: 'original description',
    group: [{ name: 'Tom', type: 'character' as const }],
    spacialCase: [{ description: 'special description', group: [] }],
  },
};

let session: EditSession;

beforeEach(() => {
  localStorage.clear();
  session = installTestEditSession({ traits: baseline });
});

afterEach(() => {
  cleanup();
  clearTestEditSession(session);
});

function renderEditor() {
  render(
    <EditModeContext
      value={{
        isEditMode: true,
        isEditModeRequested: true,
        runtimeStatus: 'ready',
        isLoading: false,
        isPreviewMode: false,
        setIsPreviewMode: jest.fn(),
      }}
    >
      <TraitEditor traitsSnapshot={baseline} />
    </EditModeContext>
  );
}

function openCard() {
  const input = screen.getByLabelText('特性编号') as HTMLInputElement;
  const details = input.closest('details')!;
  details.open = true;
  return { input, details };
}

it('keeps one pending creation through OR removal and cancels it when deleted', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  renderEditor();
  fireEvent.click(screen.getByRole('button', { name: '新建特性' }));
  await act(async () => {});
  const { input } = openCard();
  const id = input.value;
  const scope = { kind: 'domain', entityType: 'traits' } as const;
  fireEvent.click(screen.getByRole('button', { name: '添加关联组' }));
  await act(async () => {});
  fireEvent.change(screen.getByLabelText('成员名称'), { target: { value: 'Tom' } });
  await act(async () => {});
  fireEvent.click(screen.getByRole('button', { name: '添加或选项' }));
  await act(async () => {});
  fireEvent.change(screen.getAllByLabelText('成员名称')[1]!, { target: { value: 'Jerry' } });
  await act(async () => {});
  fireEvent.click(screen.getAllByRole('button', { name: '删除成员' })[0]!);
  await act(async () => {});
  expect(session.readDomain('traits')[id]?.group).toEqual([{ name: 'Jerry', type: 'character' }]);
  expect(session.readDraft(scope).actionCount).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: '删除成员' }));
  await act(async () => {});
  expect(session.readDomain('traits')[id]?.group).toEqual([]);
  expect(session.readDraft(scope).actionCount).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: '删除特性' }));
  await act(async () => {});
  expect(session.readDraft(scope)).toEqual({ actionCount: 0, publishEntries: [] });
  expect(session.readDomain('traits')).toEqual(baseline);
});

it.each([
  { label: '描述', expected: { description: '中文' } },
  { label: '成员名称', expected: { group: [{ name: '中文' }] } },
  { label: '特殊情况 1 描述', expected: { spacialCase: [{ description: '中文' }] } },
])('preserves composing text and focus while saving $label', async ({ label, expected }) => {
  renderEditor();
  const { details } = openCard();
  const input = screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement;
  act(() => input.focus());
  // React's own value setter reveals rewrites that would cancel native IME composition.
  const descriptor = Object.getOwnPropertyDescriptor(input, 'value')!;
  const writes: string[] = [];
  Object.defineProperty(input, 'value', {
    ...descriptor,
    set(value: string) {
      writes.push(value);
      descriptor.set!.call(this, value);
    },
  });
  try {
    fireEvent.compositionStart(input);
    fireEvent.input(input, {
      target: { value: 'zhong' },
      isComposing: true,
      inputType: 'insertCompositionText',
      data: 'zhong',
    });
    await act(async () => {});
    expect(writes).toEqual([]);
    expect(input).toHaveValue('zhong');
    fireEvent.compositionEnd(input, { data: '中文' });
    fireEvent.input(input, { target: { value: '中文' } });
    await act(async () => {});
    expect(input).toHaveFocus();
    expect(details.open).toBe(true);
    expect(session.readDomain('traits').original).toMatchObject(expected);
    expect(writes).toEqual([]);
  } finally {
    Object.defineProperty(input, 'value', descriptor);
  }
});

it.each([
  { isComposing: true, trackComposition: false },
  { keyCode: 229, trackComposition: false },
  { trackComposition: true },
])('keeps the ID focused during IME Enter: %j', ({ trackComposition, ...event }) => {
  renderEditor();
  const { input } = openCard();
  act(() => input.focus());
  if (trackComposition) fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: '新的编号' } });
  fireEvent.keyDown(input, { key: 'Enter', ...event });
  expect(input).toHaveFocus();
  expect(session.readDomain('traits').original).toBeDefined();
  expect(session.readDomain('traits')['新的编号']).toBeUndefined();
});

it('commits an ID with Enter after composition ends', async () => {
  renderEditor();
  const { input } = openCard();
  act(() => input.focus());
  fireEvent.compositionStart(input);
  fireEvent.change(input, { target: { value: '新的编号' } });
  fireEvent.compositionEnd(input);
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(session.readDomain('traits')['新的编号']).toBeDefined());
  expect(session.readDomain('traits').original).toBeUndefined();
});

it('keeps the focused card visible when editing away its search match', async () => {
  renderEditor();
  const search = screen.getByPlaceholderText('搜索编号、描述或成员');
  fireEvent.change(search, { target: { value: 'description' } });
  const { details } = openCard();
  const input = screen.getByLabelText('描述');
  act(() => input.focus());
  fireEvent.compositionStart(input);
  fireEvent.input(input, { target: { value: 'zhong' }, isComposing: true });
  await act(async () => {});
  expect(input).toHaveFocus();
  expect(details.open).toBe(true);
  expect(screen.getByLabelText('描述')).toBe(input);
  fireEvent.change(search, { target: { value: 'no match' } });
  expect(screen.queryByLabelText('描述')).toBeNull();
});

it('reflects draft changes made outside the text fields', async () => {
  renderEditor();
  openCard();
  await act(async () => {
    session.updateDomain('traits', (traits) => {
      traits.original!.description = 'updated description';
      traits.original!.group = [{ name: 'Jerry', type: 'character' }];
      traits.original!.spacialCase![0]!.description = 'updated special case';
    });
  });
  expect(screen.getByLabelText('描述')).toHaveValue('updated description');
  expect(screen.getByLabelText('成员名称')).toHaveValue('Jerry');
  expect(screen.getByLabelText('特殊情况 1 描述')).toHaveValue('updated special case');
});

it('keeps a new trait open and focused when renaming updates its creation filter', async () => {
  renderEditor();
  fireEvent.click(screen.getByRole('button', { name: '新建特性' }));
  const search = screen.getByPlaceholderText('搜索编号、描述或成员') as HTMLInputElement;
  const generatedId = search.value;
  await waitFor(() => expect(screen.getByLabelText('特性编号')).toHaveValue(generatedId));
  const { input, details } = openCard();
  const description = screen.getByLabelText('描述');
  act(() => input.focus());
  fireEvent.change(input, { target: { value: '新的特性' } });
  await act(async () => description.focus());

  expect(screen.getByLabelText('特性编号')).toBe(input);
  expect(input).toHaveValue('新的特性');
  expect(details.open).toBe(true);
  expect(description).toHaveFocus();
  expect(search).toHaveValue('新的特性');
  fireEvent.change(description, { target: { value: '重命名后继续编辑' } });
  await act(async () => {});
  expect(session.readDomain('traits')['新的特性']?.description).toBe('重命名后继续编辑');
  expect(session.readDomain('traits')[generatedId]).toBeUndefined();
});

it.each(['', 'orig', ' ORIGINAL '])(
  'preserves an existing card across repeated renames with filter %j',
  async (query) => {
    renderEditor();
    const search = screen.getByPlaceholderText('搜索编号、描述或成员');
    fireEvent.change(search, { target: { value: query } });
    const { input, details } = openCard();
    const description = screen.getByLabelText('描述');
    for (const nextId of ['renamed-trait', 'renamed-again', 'original']) {
      act(() => input.focus());
      fireEvent.change(input, { target: { value: nextId } });
      await act(async () => description.focus());
      expect(screen.getByLabelText('特性编号')).toBe(input);
      expect(input).toHaveValue(nextId);
      expect(details.open).toBe(true);
      expect(description).toHaveFocus();
      expect(session.readDomain('traits')[nextId]).toEqual(baseline.original);
      expect(Object.keys(session.readDomain('traits'))).toEqual([nextId]);
    }
    expect(search).toHaveValue(query === ' ORIGINAL ' ? 'original' : query);
  }
);

it.each([' ', 'taken'])(
  'preserves the editor and data when rename %j is invalid',
  async (value) => {
    session.updateDomain('traits', (traits) => {
      traits.taken = { description: 'existing trait', group: [] };
    });
    renderEditor();
    const search = screen.getByPlaceholderText('搜索编号、描述或成员');
    fireEvent.change(search, { target: { value: 'original' } });
    const { input, details } = openCard();
    const description = screen.getByLabelText('描述');
    act(() => input.focus());
    fireEvent.change(input, { target: { value } });
    await act(async () => description.focus());
    expect(input).toHaveValue('original');
    expect(details.open).toBe(true);
    expect(description).toHaveFocus();
    expect(search).toHaveValue('original');
    expect(session.readDomain('traits').original).toEqual(baseline.original);
    expect(session.readDomain('traits').taken).toEqual({
      description: 'existing trait',
      group: [],
    });
  }
);

it('preserves focus when renaming reorders a card among visible siblings', async () => {
  session.updateDomain('traits', (traits) => {
    traits.sibling = { description: 'sibling description', group: [] };
  });
  renderEditor();
  const input = screen.getByDisplayValue('original');
  const details = input.closest('details')!;
  details.open = true;
  const description = within(details).getByLabelText('描述');
  act(() => input.focus());
  fireEvent.change(input, { target: { value: 'renamed-trait' } });
  await act(async () => description.focus());
  expect(screen.getByDisplayValue('renamed-trait')).toBe(input);
  expect(details.open).toBe(true);
  expect(description).toHaveFocus();
  expect(screen.getByDisplayValue('sibling description')).toBeInTheDocument();
});

it('keeps distinct cards when a new trait reuses a renamed trait ID', async () => {
  renderEditor();
  const search = screen.getByPlaceholderText('搜索编号、描述或成员') as HTMLInputElement;
  fireEvent.click(screen.getByRole('button', { name: '新建特性' }));
  const generatedId = search.value;
  await waitFor(() => expect(screen.getByLabelText('特性编号')).toHaveValue(generatedId));
  const { input } = openCard();
  act(() => input.focus());
  fireEvent.change(input, { target: { value: 'renamed-trait' } });
  await act(async () => input.blur());
  fireEvent.click(screen.getByRole('button', { name: '新建特性' }));
  await waitFor(() => expect(screen.getByLabelText('特性编号')).toHaveValue(generatedId));
  fireEvent.change(search, { target: { value: '' } });
  expect(screen.getAllByLabelText('特性编号')).toHaveLength(3);

  for (const id of ['renamed-trait', generatedId]) {
    const details = screen.getByDisplayValue(id).closest('details')!;
    details.open = true;
    fireEvent.change(within(details).getByLabelText('描述'), { target: { value: id } });
    await act(async () => {});
  }
  expect(session.readDomain('traits')['renamed-trait']?.description).toBe('renamed-trait');
  expect(session.readDomain('traits')[generatedId]?.description).toBe(generatedId);
});
