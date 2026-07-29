'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  clearActiveEditRuntime,
  installActiveEditRuntime,
  type ActiveEditRuntime,
} from '@/lib/edit/activeEditRuntime';
import { createEditModeRegistry } from '@/lib/edit/editModeRegistry';
import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import { createEditStores } from '@/lib/edit/editStores';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

type EditBaselineResponse = {
  revision: `v1:${string}`;
  data: PublishedGameDataByType;
};

type EditRuntimeProps = {
  visibleRevision?: `v1:${string}`;
  onStatusChange: (status: EditRuntimeStatus, error?: string) => void;
  onRetry: () => void;
};

function isEditBaselineResponse(value: unknown): value is EditBaselineResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { revision?: unknown; data?: unknown };
  return (
    typeof candidate.revision === 'string' &&
    candidate.revision.startsWith('v1:') &&
    !!candidate.data &&
    typeof candidate.data === 'object'
  );
}

export default function EditRuntime({
  visibleRevision,
  onStatusChange,
  onRetry,
}: EditRuntimeProps) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<EditBaselineResponse | null>(null);
  const [status, setStatus] = useState<EditRuntimeStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const refreshAttemptedForRevisionRef = useRef<`v1:${string}` | null>(null);
  const sawRefreshPendingRef = useRef(false);
  const activeRuntimeRef = useRef<ActiveEditRuntime | null>(null);
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
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`加载编辑数据失败 (${response.status})`);
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
    if (visibleRevision || !baseline) return undefined;

    const timeout = window.setTimeout(() => {
      reportStatus('error', '当前页面没有提供可验证的已发布数据版本');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [baseline, reportStatus, visibleRevision]);

  useEffect(() => {
    if (!baseline || !visibleRevision) return;

    if (baseline.revision !== visibleRevision) {
      if (refreshAttemptedForRevisionRef.current !== visibleRevision) {
        refreshAttemptedForRevisionRef.current = visibleRevision;
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
      const stores = createEditStores(baseline.data);
      const registry = createEditModeRegistry(stores, baseline.data);
      registry.loadDrafts();
      registry.setupSubscribers();

      const runtime = Object.freeze({
        stores,
        registry,
        revision: baseline.revision,
      });
      activeRuntimeRef.current = runtime;
      installActiveEditRuntime(runtime);
      reportStatus('ready');
    } catch (error) {
      reportStatus('error', error instanceof Error ? error.message : '恢复本地编辑草稿失败');
    }
  }, [baseline, reportStatus, router, visibleRevision]);

  useEffect(() => {
    if (
      !baseline ||
      !visibleRevision ||
      baseline.revision === visibleRevision ||
      refreshAttemptedForRevisionRef.current !== visibleRevision
    ) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      reportStatus('error', '页面数据版本与编辑基线仍不一致，请重试');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [baseline, reportStatus, visibleRevision]);

  useEffect(() => {
    if (isRefreshing) {
      sawRefreshPendingRef.current = true;
      return;
    }
    if (
      sawRefreshPendingRef.current &&
      baseline &&
      visibleRevision &&
      baseline.revision !== visibleRevision
    ) {
      reportStatus('error', '页面数据版本与编辑基线仍不一致，请重试');
    }
  }, [baseline, isRefreshing, reportStatus, visibleRevision]);

  useEffect(
    () => () => {
      const runtime = activeRuntimeRef.current;
      if (!runtime) return;
      runtime.registry.teardownSubscribers();
      clearActiveEditRuntime(runtime);
      activeRuntimeRef.current = null;
    },
    []
  );

  if (status === 'ready') return null;

  const requiresFreshEditSession = status === 'error' && activeRuntimeRef.current !== null;

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-3 z-[10060] flex justify-center px-3'>
      <div className='pointer-events-auto rounded-lg border border-blue-200 bg-white/95 px-3 py-2 text-sm text-gray-700 shadow-lg backdrop-blur dark:border-blue-900 dark:bg-gray-900/95 dark:text-gray-200'>
        {status === 'error'
          ? requiresFreshEditSession
            ? `${errorMessage ?? '编辑环境版本已过期'}，请退出编辑模式后重新进入`
            : (errorMessage ?? '编辑环境初始化失败')
          : baseline && visibleRevision && baseline.revision === visibleRevision
            ? '正在恢复编辑环境…'
            : '正在加载编辑数据…'}
        {!requiresFreshEditSession ? (
          <button
            type='button'
            onClick={onRetry}
            className='ml-3 text-blue-600 hover:underline dark:text-blue-400'
          >
            重试
          </button>
        ) : null}
      </div>
    </div>
  );
}
