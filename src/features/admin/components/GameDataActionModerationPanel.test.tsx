import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { characters } from '@/data/store';
import { summarizeGameActionValue } from '@/features/admin/utils/gameActionPreview';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';

import GameDataActionModerationPanel, {
  type PendingGameDataAction,
} from './GameDataActionModerationPanel';

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

const sampleAction: PendingGameDataAction = {
  action_id: 'action-1',
  entity_type: 'characters',
  status: 'pending',
  created_by: 'user-1',
  created_by_nickname: 'Alice',
  created_at: '2026-05-10T06:49:28.749Z',
  message: '',
  reviewed_at: '',
  reviewed_by: '',
  reviewed_by_nickname: '',
  rejection_reason: '',
  is_public: false,
};

const sampleEntry = {
  op: 'set',
  path: '侦探泰菲.mousePositioningTags',
  oldValue: ['奶酪'],
  newValue: ['奶酪', '救援'],
};

const detailEntries: Record<string, unknown> = {};

describe('GameDataActionModerationPanel', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    for (const key of Object.keys(detailEntries)) delete detailEntries[key];
    detailEntries[sampleAction.action_id] = sampleEntry;
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const actionId = decodeURIComponent(url.split('/').at(-1) ?? '');
      return {
        ok: true,
        json: async () => ({ action_id: actionId, entry: detailEntries[actionId] ?? sampleEntry }),
      } as Response;
    });
  });

  it('hides the year for current-year submit and review dates', () => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const currentYearPendingAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-current-pending',
      created_at: `${currentYear}-05-10T06:49:28.749Z`,
    };
    const currentYearApprovedAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-current-approved',
      status: 'approved',
      created_at: `${currentYear}-05-10T06:49:28.749Z`,
      reviewed_at: `${currentYear}-05-11T07:30:00.000Z`,
      reviewed_by: 'reviewer-1',
      reviewed_by_nickname: 'Reviewer',
      is_public: true,
    };
    const previousYearAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-previous',
      created_at: `${previousYear}-05-10T06:49:28.749Z`,
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[currentYearPendingAction, currentYearApprovedAction, previousYearAction]}
        mutatePendingActions={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'all' } });

    expect(screen.queryAllByText(String(currentYear), { exact: false })).toHaveLength(0);
    expect(screen.getAllByText(String(previousYear), { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Alice' })[0]).toHaveAttribute(
      'href',
      '/users/Alice'
    );
    expect(screen.getByRole('link', { name: 'Reviewer' })).toHaveAttribute(
      'href',
      '/users/Reviewer'
    );
  });

  it('hides review details when the submitter reviewed their own action', () => {
    const selfReviewedAction: PendingGameDataAction = {
      ...sampleAction,
      status: 'approved',
      reviewed_at: '2026-05-11T07:30:00.000Z',
      reviewed_by: sampleAction.created_by,
      reviewed_by_nickname: 'Alice',
      is_public: true,
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[selfReviewedAction]}
        mutatePendingActions={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'all' } });

    expect(screen.getByRole('link', { name: 'Alice' })).toHaveAttribute('href', '/users/Alice');
    expect(screen.queryByText('审核：')).not.toBeInTheDocument();
    expect(screen.queryByText('2026-05-11', { exact: false })).not.toBeInTheDocument();
  });

  it('distinguishes public pending rows and exposes approve plus revoke instead of reject', () => {
    const publicPendingAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-public-pending',
      is_public: true,
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[publicPendingAction]}
        mutatePendingActions={jest.fn()}
        canRevokeActions
      />
    );

    expect(screen.getByText('已公开')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '批准' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '撤销' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '拒绝' })).not.toBeInTheDocument();
  });

  it('hides the public badge for approved rows', () => {
    const approvedAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-approved',
      status: 'approved',
      reviewed_at: '2026-05-11T07:30:00.000Z',
      reviewed_by: 'reviewer-1',
      reviewed_by_nickname: 'Reviewer',
      is_public: true,
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[approvedAction]}
        mutatePendingActions={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'all' } });

    expect(screen.queryByText('已公开')).not.toBeInTheDocument();
  });

  it('shows only revoke for public pending rows when the moderator cannot approve or reject', () => {
    const publicPendingAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-public-pending',
      is_public: true,
    };

    render(
      <GameDataActionModerationPanel
        canApproveActions={false}
        canRejectActions={false}
        canRevokeActions
        pendingActions={[publicPendingAction]}
        mutatePendingActions={jest.fn()}
      />
    );

    expect(
      screen.queryByRole('checkbox', { name: '选择改动 action-public-pending' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '批准' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '拒绝' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '撤销' })).toBeInTheDocument();
  });

  it('uses an exact action UUID lookup instead of scanning list content', () => {
    const onActionIdChange = jest.fn();
    const actionId = 'de305d54-75b4-431b-adb2-eb6b9e546014';
    const otherAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-2',
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[sampleAction, otherAction]}
        mutatePendingActions={jest.fn()}
        onActionIdChange={onActionIdChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('完整 action UUID'), {
      target: { value: actionId },
    });
    fireEvent.click(screen.getByRole('button', { name: '查找ID' }));

    expect(onActionIdChange).toHaveBeenCalledWith(actionId);
    expect(screen.getByText('本页已加载 2 条')).toBeInTheDocument();
  });

  it('keeps copy ID with copy JSON in expanded details and uses an icon-only expander', async () => {
    render(
      <GameDataActionModerationPanel
        pendingActions={[sampleAction]}
        mutatePendingActions={jest.fn()}
      />
    );

    const expandButton = screen.getByRole('button', { name: '展开详情' });
    expect(expandButton).not.toHaveTextContent('展开详情');
    expect(expandButton).not.toHaveTextContent('收起详情');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.getByRole('button', { name: '拒绝' }).compareDocumentPosition(expandButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: '复制ID' })).not.toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.getByRole('button', { name: '收起详情' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.getByRole('button', { name: '复制ID' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '复制JSON' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: '复制JSON' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: '收起详情' }));
    fireEvent.click(screen.getByRole('button', { name: '展开详情' }));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('hides unchanged array summaries when changed fields explain the diff', async () => {
    const actionWithNestedArrayChange: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-nested-array-change',
    };
    detailEntries[actionWithNestedArrayChange.action_id] = {
      op: 'set',
      path: '侍卫汤姆.countersKnowledgeCards',
      oldValue: [
        { id: '回家', isMinor: false, description: '侍卫汤姆的警戒可以清除回家的护盾' },
        { id: '护佑', isMinor: false, description: '侍卫汤姆的警戒可以清除护佑的护盾' },
        { id: '无畏', isMinor: true, description: '侍卫汤姆的警戒可以清除无畏的无敌' },
        { id: '舍己', isMinor: false, description: '侍卫汤姆的警戒可以清除舍己的无敌' },
      ],
      newValue: [
        { id: '回家', isMinor: false, description: '侍卫汤姆的警戒可以清除回家的护盾' },
        { id: '护佑', isMinor: false, description: '侍卫汤姆的警戒可以清除护佑的护盾' },
        { id: '无畏', isMinor: true, description: '侍卫汤姆的警戒可以清除无畏的无敌' },
        { id: '舍己', isMinor: true, description: '侍卫汤姆的警戒可以清除舍己的无敌' },
      ],
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[actionWithNestedArrayChange]}
        mutatePendingActions={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开详情' }));

    expect(await screen.findByText('侍卫汤姆.countersKnowledgeCards')).toBeInTheDocument();
    expect(screen.getByText('变更字段：')).toBeInTheDocument();
    expect(
      screen.getAllByText(
        (_content, element) =>
          element?.textContent?.includes('舍己') === true && element.textContent.includes('isMinor')
      ).length
    ).toBeGreaterThan(0);
    expect(screen.queryByText('数组(4: 回家、护佑、无畏 等)')).not.toBeInTheDocument();
  });

  it('uses projected character relations as the old preview value when relation overlays are first set', async () => {
    const projectedCounters = getCharacterRelation(characters, '恶魔汤姆').counters;
    const existingCounterId = projectedCounters[0]?.id;

    expect(projectedCounters.length).toBeGreaterThan(0);
    expect(existingCounterId).toBeDefined();

    const actionWithMissingRelationOldValue: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-character-relation-overlay',
      entity_type: 'characters',
    };
    detailEntries[actionWithMissingRelationOldValue.action_id] = {
      op: 'set',
      path: '恶魔汤姆.counters',
      newValue: [
        ...projectedCounters,
        {
          id: '__preview_added__',
          isMinor: false,
          description: 'new preview relation',
        },
      ],
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[actionWithMissingRelationOldValue]}
        mutatePendingActions={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开详情' }));

    expect(
      await screen.findByText(summarizeGameActionValue(projectedCounters))
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (content) => content.includes('新增ID') && content.includes('__preview_added__')
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        (content) => content.includes('新增ID') && content.includes(existingCounterId!)
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('keeps read-only controls enabled while moderation is in flight', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      if (String(input).startsWith('/api/game-data-actions/admin/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ action_id: sampleAction.action_id, entry: sampleEntry }),
        } as Response);
      }
      return new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
    });
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <GameDataActionModerationPanel
        pendingActions={[sampleAction]}
        mutatePendingActions={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开详情' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '复制JSON' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '批准' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批准' })).toBeDisabled();
    });

    expect(screen.getByTitle('过滤状态')).toBeDisabled();
    expect(screen.getByRole('button', { name: '收起详情' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '复制ID' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '复制JSON' })).not.toBeDisabled();

    await act(async () => {
      resolveFetch({
        ok: true,
        json: async () => ({}),
      } as Response);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByTitle('过滤状态')).not.toBeDisabled());
  });

  it('shows only the approved-action sync button for super admins', () => {
    const approvedAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-approved',
      status: 'approved',
      reviewed_at: '2026-05-11T07:30:00.000Z',
      reviewed_by: 'reviewer-1',
      reviewed_by_nickname: 'Reviewer',
      is_public: true,
    };
    const rejectedAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-rejected',
      status: 'rejected',
      reviewed_at: '2026-05-11T07:30:00.000Z',
      reviewed_by: 'reviewer-1',
      reviewed_by_nickname: 'Reviewer',
      rejection_reason: '内容有误',
    };

    const { rerender } = render(
      <GameDataActionModerationPanel
        pendingActions={[approvedAction, rejectedAction]}
        mutatePendingActions={jest.fn()}
      />
    );

    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'all' } });

    expect(screen.queryByRole('button', { name: '标为已同步' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '标为已拒绝' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '标为已批准' })).not.toBeInTheDocument();

    rerender(
      <GameDataActionModerationPanel
        pendingActions={[approvedAction, rejectedAction]}
        mutatePendingActions={jest.fn()}
        canMarkActionsSynced
      />
    );

    expect(screen.getByRole('button', { name: '标为已同步' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '撤销' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '标为已拒绝' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '标为已批准' })).not.toBeInTheDocument();
  });

  it('shows and submits revoke only for approved actions when authorized', async () => {
    const mutatePendingActions = jest.fn().mockResolvedValue(undefined);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    global.fetch = fetchMock;
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const approvedAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-approved',
      status: 'approved',
      reviewed_at: '2026-05-11T07:30:00.000Z',
      reviewed_by: 'reviewer-1',
      reviewed_by_nickname: 'Reviewer',
      is_public: true,
    };
    const syncedAction: PendingGameDataAction = {
      ...approvedAction,
      action_id: 'action-synced',
      status: 'synced',
    };
    const rejectedAction: PendingGameDataAction = {
      ...approvedAction,
      action_id: 'action-rejected',
      status: 'rejected',
      is_public: false,
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[approvedAction, syncedAction, rejectedAction]}
        mutatePendingActions={mutatePendingActions}
        canRevokeActions
      />
    );

    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'all' } });
    expect(screen.getAllByRole('button', { name: '撤销' })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: '撤销' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/game-data-actions/moderation/action-approved?action=revoke',
        expect.objectContaining({ method: 'POST' })
      );
    });
    await waitFor(() => expect(mutatePendingActions).toHaveBeenCalledTimes(1));
  });

  it('submits super-admin mark-synced actions', async () => {
    const mutatePendingActions = jest.fn().mockResolvedValue(undefined);
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    global.fetch = fetchMock;
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    const approvedAction: PendingGameDataAction = {
      ...sampleAction,
      action_id: 'action-approved',
      status: 'approved',
      reviewed_at: '2026-05-11T07:30:00.000Z',
      reviewed_by: 'reviewer-1',
      reviewed_by_nickname: 'Reviewer',
      is_public: true,
    };

    render(
      <GameDataActionModerationPanel
        pendingActions={[approvedAction]}
        mutatePendingActions={mutatePendingActions}
        canMarkActionsSynced
      />
    );

    fireEvent.change(screen.getByTitle('过滤状态'), { target: { value: 'all' } });

    fireEvent.click(screen.getByRole('button', { name: '标为已同步' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/game-data-actions/moderation/action-approved?action=mark-synced',
        expect.objectContaining({ method: 'POST' })
      );
    });
    await waitFor(() => expect(mutatePendingActions).toHaveBeenCalledTimes(1));
  });
});
