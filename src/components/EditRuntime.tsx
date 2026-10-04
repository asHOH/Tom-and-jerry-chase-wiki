'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { clearActiveEditSession, installActiveEditSession } from '@/lib/edit/activeEditSession';
import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import { createEditSession, type EditSession } from '@/lib/edit/editSession';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import Button from '@/components/ui/Button';

type EditBaselineResponse = {
  revision: `v1:${string}`;
  domainRevisions: Record<PublishableEntityType, `v1:${string}`>;
  data: PublishedGameDataByType;
};

type EditBaselineErrorResponse = {
  error?: string;
};

type EditRuntimeProps = {
  visibleRevisions: readonly `v1:${string}`[];
  onStatusChange: (status: EditRuntimeStatus, error?: string) => void;
  onRetry: () => void;
};

function isEditBaselineResponse(value: unknown): value is EditBaselineResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as {
    revision?: unknown;
    domainRevisions?: Record<string, unknown>;
    data?: unknown;
  };
  return (
    typeof candidate.revision === 'string' &&
    candidate.revision.startsWith('v1:') &&
    !!candidate.domainRevisions &&
    PUBLISHABLE_ENTITY_TYPES.every((entityType) => {
      const revision = candidate.domainRevisions?.[entityType];
      return typeof revision === 'string' && revision.startsWith('v1:');
    }) &&
    !!candidate.data &&
    typeof candidate.data === 'object'
  );
}

export default function EditRuntime({
  visibleRevisions,
  onStatusChange,
  onRetry,
}: EditRuntimeProps) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<EditBaselineResponse | null>(null);
  const [status, setStatus] = useState<EditRuntimeStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const refreshAttemptedForRevisionRef = useRef<string | null>(null);
  const visibleRevisionKey = [...new Set(visibleRevisions)].sort().join(',');
  const baselineMatches =
    !!baseline &&
    visibleRevisions.length > 0 &&
    visibleRevisions.every(
      (revision) =>
        revision === baseline.revision || Object.values(baseline.domainRevisions).includes(revision)
    );
  const sawRefreshPendingRef = useRef(false);
  const activeRuntimeRef = useRef<EditSession | null>(null);
  const reportStatus = useCallback(
    (nextStatus: EditRuntimeStatus, error?: string) => {
      setStatus(nextStatus);
      setErrorMessage(error);
      onStatusChange(nextStatus, error);
    },
    [onStatusChange]
  );

  useEffect(() => {
    const controller = new AbortController();

    reportStatus('loading');
    void fetch('/api/game-data-actions/edit-baseline', {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response
            .json()
            .catch(() => null)) as EditBaselineErrorResponse | null;
          const fallbackMessages: Record<number, string> = {
            403: '编辑数据刷新请求来源无效',
            429: '编辑数据刷新过于频繁，请稍后重试',
          };
          throw new Error(
            body?.error ??
              fallbackMessages[response.status] ??
              `加载编辑数据失败 (${response.status})`
          );
        }
        const body: unknown = await response.json();
        if (!isEditBaselineResponse(body)) {
          throw new Error('编辑数据响应格式无效');
        }
        setBaseline(body);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        reportStatus('error', error instanceof Error ? error.message : '加载编辑数据失败');
      });

    return () => controller.abort();
  }, [reportStatus]);

  useEffect(() => {
    if (visibleRevisionKey || !baseline) return undefined;

    const timeout = window.setTimeout(() => {
      reportStatus('error', '当前页面没有提供可验证的已发布数据版本');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [baseline, reportStatus, visibleRevisionKey]);

  useEffect(() => {
    if (!baseline || !visibleRevisionKey) return;

    if (!baselineMatches) {
      if (refreshAttemptedForRevisionRef.current !== visibleRevisionKey) {
        refreshAttemptedForRevisionRef.current = visibleRevisionKey;
        sawRefreshPendingRef.current = false;
        reportStatus('refreshing');
        startRefreshTransition(() => router.refresh());
      }
      return;
    }

    refreshAttemptedForRevisionRef.current = null;
    sawRefreshPendingRef.current = false;
    if (activeRuntimeRef.current) {
      reportStatus('ready');
      return;
    }

    reportStatus('restoring');
    try {
      const runtime = createEditSession(baseline.data, baseline.revision);
      activeRuntimeRef.current = runtime;
      installActiveEditSession(runtime);
      reportStatus('ready');
    } catch (error) {
      reportStatus('error', error instanceof Error ? error.message : '恢复本地编辑草稿失败');
    }
  }, [baseline, baselineMatches, reportStatus, router, visibleRevisionKey]);

  useEffect(() => {
    if (
      !baseline ||
      !visibleRevisionKey ||
      baselineMatches ||
      refreshAttemptedForRevisionRef.current !== visibleRevisionKey
    ) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      reportStatus('error', '页面数据版本与编辑基线仍不一致，请重试');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [baseline, baselineMatches, reportStatus, visibleRevisionKey]);

  useEffect(() => {
    if (isRefreshing) {
      sawRefreshPendingRef.current = true;
      return;
    }
    if (sawRefreshPendingRef.current && baseline && visibleRevisionKey && !baselineMatches) {
      reportStatus('error', '页面数据版本与编辑基线仍不一致，请重试');
    }
  }, [baseline, baselineMatches, isRefreshing, reportStatus, visibleRevisionKey]);

  useEffect(
    () => () => {
      const runtime = activeRuntimeRef.current;
      if (!runtime) return;
      clearActiveEditSession(runtime);
      activeRuntimeRef.current = null;
      runtime.dispose();
    },
    []
  );

  if (status === 'ready') return null;

  const requiresFreshEditSession = status === 'error' && activeRuntimeRef.current !== null;

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-3 z-[10060] flex justify-center px-3'>
      <div className='bg-surface-raised/95 text-foreground pointer-events-auto rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-lg backdrop-blur dark:border-blue-900'>
        {status === 'error'
          ? requiresFreshEditSession
            ? `${errorMessage ?? '编辑环境版本已过期'}，请退出编辑模式后重新进入`
            : (errorMessage ?? '编辑环境初始化失败')
          : baselineMatches
            ? '正在恢复编辑环境…'
            : '正在加载编辑数据…'}
        {!requiresFreshEditSession ? (
          <Button
            variant='unstyled'
            type='button'
            onClick={onRetry}
            className='ml-3 text-blue-600 hover:underline dark:text-blue-400'
          >
            重试
          </Button>
        ) : null}
      </div>
    </div>
  );
}
