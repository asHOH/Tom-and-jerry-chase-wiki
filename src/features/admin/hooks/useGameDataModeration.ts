'use client';

import { useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

import { useToast } from '@/context/ToastContext';

export type PendingModerationAction = 'approve' | 'reject';
type ModerationAction = PendingModerationAction | 'mark-synced' | 'revoke';
type ModerationFailure = { actionId: string; message: string };

const SUCCESS_MESSAGE: Record<ModerationAction, string> = {
  approve: '已批准，该改动已公开',
  reject: '已拒绝',
  'mark-synced': '已标记为已同步',
  revoke: '已撤销，该改动已从公开 replay 移除',
};

const failureMessage = (failure: unknown): string =>
  failure instanceof Error ? failure.message : '操作失败';

function summarizeFailures(failures: ModerationFailure[]): string {
  const preview = failures
    .slice(0, 3)
    .map(({ actionId, message }) => `${actionId}: ${message}`)
    .join('；');
  const suffix = failures.length > 3 ? `；另有 ${failures.length - 3} 条失败` : '';
  return `${preview}${suffix}`;
}

async function submitThanks(actionId: string, message: string) {
  const response = await fetch(
    `/api/contributions/game-data/${encodeURIComponent(actionId)}/thank`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }
  );
  const payload = (await response.json().catch(() => null)) as {
    created?: boolean;
    error?: string;
  } | null;
  if (!response.ok) throw new Error(payload?.error ?? '感谢发送失败');
  return payload?.created !== false;
}

export function useGameDataModeration(refreshList: () => Promise<unknown> | unknown) {
  const [moderatingActionId, setModeratingActionId] = useState<string | null>(null);
  const busy = useRef(false);
  const { mutate } = useSWRConfig();
  const { success, error } = useToast();

  async function refreshAfterModeration() {
    await refreshList();
    try {
      await mutate(
        (key) =>
          typeof key === 'string' && key.startsWith('/api/game-data-actions/pending-targets?')
      );
    } catch {
      // Pending awareness is advisory; moderation has already succeeded.
    }
  }

  async function run(actionId: string, operation: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setModeratingActionId(actionId);
    try {
      await operation();
    } catch (failure) {
      error(failureMessage(failure));
    } finally {
      busy.current = false;
      setModeratingActionId(null);
    }
  }

  const moderate = (
    actionId: string,
    action: ModerationAction,
    options?: { reason?: string | null; thankMessage?: string }
  ) =>
    run(actionId, async () => {
      const response = await fetch(
        `/api/game-data-actions/moderation/${encodeURIComponent(actionId)}?action=${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          ...(action === 'reject'
            ? {
                body: JSON.stringify(
                  options?.reason?.trim() ? { reason: options.reason.trim() } : {}
                ),
              }
            : {}),
        }
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || '操作失败');
      }

      let thanksFailed = false;
      if (action === 'approve' && options?.thankMessage) {
        try {
          await submitThanks(actionId, options.thankMessage);
        } catch (thankError) {
          error(
            `改动已批准，但感谢发送失败：${thankError instanceof Error ? thankError.message : '未知错误'}`
          );
          thanksFailed = true;
        }
      }
      if (!thanksFailed) {
        success(
          action === 'approve' && options?.thankMessage
            ? '已批准并向编辑者发送感谢'
            : SUCCESS_MESSAGE[action]
        );
      }
      await refreshAfterModeration();
    });

  const moderateMany = (
    actionIds: string[],
    action: PendingModerationAction,
    reason?: string | null
  ) => {
    if (actionIds.length === 0) return Promise.resolve();
    return run('batch', async () => {
      const response = await fetch('/api/game-data-actions/moderation/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionIds,
          action,
          ...(reason?.trim() ? { reason: reason.trim() } : {}),
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
        failures?: ModerationFailure[];
        succeeded?: string[];
      } | null;
      if (!response.ok) throw new Error(result?.error || '批量操作失败');

      const failures = result?.failures ?? [];
      const successCount = result?.succeeded?.length ?? 0;
      await refreshAfterModeration();

      const actionLabel = action === 'approve' ? '批准' : '拒绝';
      if (failures.length === 0) {
        success(`已批量${actionLabel} ${successCount} 条`);
      } else if (successCount > 0) {
        error(
          `已${actionLabel} ${successCount} 条，失败 ${failures.length} 条：${summarizeFailures(failures)}`
        );
      } else {
        error(`批量${actionLabel}失败：${summarizeFailures(failures)}`);
      }
    });
  };

  const thank = (actionId: string, message: string) =>
    run(actionId, async () => {
      const created = await submitThanks(actionId, message);
      success(created ? '已向编辑者发送感谢' : '这次贡献已经感谢过了');
    });

  return { moderatingActionId, moderate, moderateMany, thank };
}
