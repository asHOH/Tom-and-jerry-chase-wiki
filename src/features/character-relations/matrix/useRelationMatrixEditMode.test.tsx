import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { getActionsStorageKey, readActionHistory, writeActionHistory } from '@/lib/edit/diffUtils';
import { characters } from '@/data/store';

import { useRelationMatrixEditMode } from './useRelationMatrixEditMode';

const mockInfo = jest.fn();
const mockSuccess = jest.fn();
const mockError = jest.fn();

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    info: mockInfo,
    success: mockSuccess,
    error: mockError,
  }),
}));

const storageKey = getActionsStorageKey('characters');

function RelationEditModeProbe() {
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    discardChanges,
    publishChanges,
    getActionCount,
  } = useRelationMatrixEditMode();

  return (
    <div>
      <div data-testid='dirty'>{String(isDirty)}</div>
      <div data-testid='publishing'>{String(isPublishing)}</div>
      <div data-testid='count'>{getActionCount()}</div>
      <div data-testid='draft-info'>{draftInfo?.actionCount ?? 0}</div>
      <div data-testid='draft-summary'>{draftsSummary.map((item) => item.itemLabel).join(',')}</div>
      <button type='button' onClick={() => discardChanges()}>
        discard
      </button>
      <button type='button' onClick={() => void publishChanges('关系更新')}>
        publish
      </button>
    </div>
  );
}

const renderProbe = () => render(<RelationEditModeProbe />);

describe('useRelationMatrixEditMode', () => {
  let characterSnapshot: Record<string, unknown>;

  beforeEach(() => {
    characterSnapshot = structuredClone(characters) as Record<string, unknown>;
    window.localStorage.clear();
    mockInfo.mockClear();
    mockSuccess.mockClear();
    mockError.mockClear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    cleanup();
    Object.keys(characters).forEach((key) => {
      delete (characters as Record<string, unknown>)[key];
    });
    Object.entries(characterSnapshot).forEach(([key, value]) => {
      (characters as Record<string, unknown>)[key] = value;
    });
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('counts relation actions and excludes unrelated character drafts', () => {
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      [
        { op: 'set', path: '汤姆.counteredBy', oldValue: [], newValue: [{ id: '杰瑞' }] },
        { op: 'set', path: '汤姆.description', oldValue: 'old', newValue: 'new' },
      ],
    ]);

    renderProbe();

    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');
    expect(screen.getByTestId('draft-info')).toHaveTextContent('2');
    expect(screen.getByTestId('draft-summary')).toHaveTextContent('杰瑞');
    expect(screen.getByTestId('draft-summary')).toHaveTextContent('汤姆');
  });

  it('publishes only relation actions and preserves unrelated character drafts', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn(),
    });
    global.fetch = fetchMock;
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
    ]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'publish' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/game-data-actions/publish-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: [{ op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] }],
          message: '关系更新',
        }),
      });
      expect(readActionHistory(storageKey)).toEqual([
        { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      ]);
    });
  });

  it('discards relation actions with suppressed inverse replay and preserves unrelated drafts', async () => {
    (characters['杰瑞'] as unknown as { counters?: unknown }).counters = [{ id: '汤姆' }];
    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
      { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
    ]);
    renderProbe();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'discard' }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect((characters['杰瑞'] as unknown as { counters?: unknown }).counters).toEqual([]);
      expect(readActionHistory(storageKey)).toEqual([
        { op: 'set', path: '杰瑞.description', oldValue: 'old', newValue: 'new' },
      ]);
      expect(screen.getByTestId('dirty')).toHaveTextContent('false');
    });
  });

  it('updates dirty state and draft info after relation overlay writes touch the characters store', async () => {
    renderProbe();
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');

    writeActionHistory(storageKey, [
      { op: 'set', path: '杰瑞.counters', oldValue: [], newValue: [{ id: '汤姆' }] },
    ]);

    await act(async () => {
      (characters['杰瑞'] as unknown as { counters?: unknown }).counters = [{ id: '汤姆' }];
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId('dirty')).toHaveTextContent('true');
      expect(screen.getByTestId('draft-info')).toHaveTextContent('1');
    });
  });
});
