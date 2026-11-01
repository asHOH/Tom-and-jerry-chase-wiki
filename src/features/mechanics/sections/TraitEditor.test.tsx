import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

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
