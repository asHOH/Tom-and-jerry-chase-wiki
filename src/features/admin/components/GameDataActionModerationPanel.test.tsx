import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

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
  entry: {
    op: 'set',
    path: '侦探泰菲.mousePositioningTags',
    oldValue: ['奶酪'],
    newValue: ['奶酪', '救援'],
  },
};

describe('GameDataActionModerationPanel', () => {
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
  });

  it('keeps copy ID with copy JSON in expanded details and uses an icon-only expander', () => {
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
  });

  it('keeps read-only controls enabled while moderation is in flight', async () => {
    let resolveFetch: (value: Response) => void = () => {};
    global.fetch = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <GameDataActionModerationPanel
        pendingActions={[sampleAction]}
        mutatePendingActions={jest.fn().mockResolvedValue(undefined)}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '展开详情' }));
    fireEvent.click(screen.getByRole('button', { name: '批准' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '批准' })).toBeDisabled();
    });

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
  });
});
