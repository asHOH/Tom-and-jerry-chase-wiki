'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { clearActiveEditSession, installActiveEditSession } from '@/lib/edit/activeEditSession';
import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import { createEditSession, type EditSession } from '@/lib/edit/editSession';
import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import type {
  PublishedDomainRevision,
  PublishedGameDataByType,
} from '@/lib/gameData/published/types';
import { stripEditParam } from '@/hooks/useSearchParamEditMode';
import { BaseDialog } from '@/components/ui/BaseDialog';
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
  visibleRevisions: readonly PublishedDomainRevision[];
  onStatusChange: (status: EditRuntimeStatus, error?: string) => void;
  onRetry: () => void;
  onUnsavedDraftsChange?: (unsaved: boolean) => void;
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

async function fetchEditBaseline(
  signal: AbortSignal,
  visibleRevisions?: readonly PublishedDomainRevision[]
): Promise<EditBaselineResponse> {
  const response = await fetch('/api/game-data-actions/edit-baseline', {
    method: 'POST',
    cache: 'no-store',
    signal,
    ...(visibleRevisions
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleRevisions }),
        }
      : {}),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as EditBaselineErrorResponse | null;
    const fallbackMessages: Record<number, string> = {
      403: '编辑数据刷新请求来源无效',
      429: '编辑数据刷新过于频繁，请稍后重试',
    };
    throw new Error(
      body?.error ?? fallbackMessages[response.status] ?? `加载编辑数据失败 (${response.status})`
    );
  }
  const body: unknown = await response.json();
  if (!isEditBaselineResponse(body)) throw new Error('编辑数据响应格式无效');
  return body;
}

export default function EditRuntime({
  visibleRevisions,
  onStatusChange,
  onRetry,
  onUnsavedDraftsChange,
}: EditRuntimeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [baseline, setBaseline] = useState<EditBaselineResponse | null>(null);
  const [status, setStatus] = useState<EditRuntimeStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [hasUnsavedDrafts, setHasUnsavedDrafts] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const abandoned = useRef(false);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const refreshAttemptedForPathRef = useRef<string | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'pending' | 'complete' | 'failed'>(
    'idle'
  );
  const recoveryControllerRef = useRef<AbortController | null>(null);
  const visibleRevisionKey = visibleRevisions
    .map(({ entityType, revision }) => `${entityType}:${revision}`)
    .sort()
    .join(',');
  const baselineMatches =
    !!baseline &&
    visibleRevisions.length > 0 &&
    visibleRevisions.every(
      ({ entityType, revision }) => revision === baseline.domainRevisions[entityType]
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
    void fetchEditBaseline(controller.signal)
      .then((body) => {
        if (!controller.signal.aborted) setBaseline(body);
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
    if (
      abandoned.current ||
      !baseline ||
      !visibleRevisionKey ||
      recoveryStatus === 'pending' ||
      recoveryStatus === 'failed'
    )
      return;

    if (!baselineMatches) {
      if (!activeRuntimeRef.current && recoveryStatus === 'idle') {
        const controller = new AbortController();
        recoveryControllerRef.current = controller;
        setRecoveryStatus('pending');
        reportStatus('refreshing');
        void fetchEditBaseline(controller.signal, visibleRevisions)
          .then((body) => {
            if (controller.signal.aborted) return;
            setBaseline(body);
            setRecoveryStatus('complete');
          })
          .catch((error: unknown) => {
            if (controller.signal.aborted) return;
            setRecoveryStatus('failed');
            reportStatus('error', error instanceof Error ? error.message : '刷新编辑数据失败');
          });
        return;
      }
      if (refreshAttemptedForPathRef.current !== pathname) {
        refreshAttemptedForPathRef.current = pathname;
        sawRefreshPendingRef.current = false;
        reportStatus('refreshing');
        startRefreshTransition(() => router.refresh());
      }
      return;
    }

    refreshAttemptedForPathRef.current = null;
    sawRefreshPendingRef.current = false;
    if (activeRuntimeRef.current) {
      reportStatus('ready');
      return;
    }

    reportStatus('restoring');
    try {
      const runtime = createEditSession(baseline.data, baseline.revision);
      activeRuntimeRef.current = runtime;
      setHasUnsavedDrafts(runtime.hasUnsavedDrafts());
      runtime.subscribe({ kind: 'draft-overview' }, () => {
        setHasUnsavedDrafts(runtime.hasUnsavedDrafts());
        onUnsavedDraftsChange?.(runtime.hasUnsavedDrafts());
      });
      installActiveEditSession(runtime);
      reportStatus('ready');
    } catch (error) {
      reportStatus('error', error instanceof Error ? error.message : '恢复本地编辑草稿失败');
    }
  }, [
    baseline,
    baselineMatches,
    onUnsavedDraftsChange,
    pathname,
    recoveryStatus,
    reportStatus,
    router,
    visibleRevisionKey,
    visibleRevisions,
  ]);

  useEffect(() => {
    if (
      !baseline ||
      !visibleRevisionKey ||
      baselineMatches ||
      recoveryStatus === 'pending' ||
      recoveryStatus === 'failed' ||
      refreshAttemptedForPathRef.current !== pathname
    ) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      reportStatus('error', '页面数据版本与编辑基线仍不一致，请重试');
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [baseline, baselineMatches, pathname, recoveryStatus, reportStatus, visibleRevisionKey]);

  useEffect(() => {
    if (isRefreshing) {
      sawRefreshPendingRef.current = true;
      return;
    }
    if (
      sawRefreshPendingRef.current &&
      baseline &&
      visibleRevisionKey &&
      !baselineMatches &&
      recoveryStatus !== 'pending' &&
      recoveryStatus !== 'failed'
    ) {
      reportStatus('error', '页面数据版本与编辑基线仍不一致，请重试');
    }
  }, [baseline, baselineMatches, isRefreshing, recoveryStatus, reportStatus, visibleRevisionKey]);

  useEffect(
    () => () => {
      recoveryControllerRef.current?.abort();
      const runtime = activeRuntimeRef.current;
      if (!runtime) return;
      clearActiveEditSession(runtime);
      activeRuntimeRef.current = null;
      runtime.dispose();
    },
    []
  );

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!activeRuntimeRef.current?.hasUnsavedDrafts()) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, []);

  if (abandoned.current || (status === 'ready' && !hasUnsavedDrafts)) return null;

  const requiresFreshEditSession =
    !hasUnsavedDrafts && status === 'error' && activeRuntimeRef.current !== null;

  return (
    <div className='pointer-events-none fixed inset-x-0 top-(--nav-height) z-40 flex justify-center px-3 in-[.offline-banner-visible]:mt-(--offline-banner-height)'>
      <div className='bg-surface-raised/95 text-foreground pointer-events-auto rounded-lg border border-blue-200 px-3 py-2 text-sm shadow-lg backdrop-blur dark:border-blue-900'>
        {hasUnsavedDrafts
          ? '草稿暂未保存，刷新或离开可能丢失修改。'
          : status === 'error'
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
            onClick={
              hasUnsavedDrafts ? () => activeRuntimeRef.current?.retryDraftPersistence() : onRetry
            }
            className='ml-3 text-blue-600 hover:underline dark:text-blue-400'
          >
            {hasUnsavedDrafts ? '重试保存' : '重试'}
          </Button>
        ) : null}
        {hasUnsavedDrafts ? (
          <Button variant='unstyled' className='ml-3' onClick={() => setConfirmLeave(true)}>
            退出并保留已存草稿
          </Button>
        ) : null}
        <BaseDialog
          open={confirmLeave}
          onOpenChange={setConfirmLeave}
          ariaLabel='退出编辑'
          size='sm'
        >
          <div className='p-4'>
            <p>本次尚未保存的修改将丢失。已保存的草稿和提交记录会保留。确认退出编辑？</p>
            <div className='mt-4 flex justify-end gap-2'>
              <Button onClick={() => setConfirmLeave(false)}>继续编辑</Button>
              <Button
                variant='danger'
                onClick={() => {
                  abandoned.current = true;
                  const runtime = activeRuntimeRef.current;
                  if (runtime) {
                    clearActiveEditSession(runtime);
                    runtime.dispose();
                  }
                  activeRuntimeRef.current = null;
                  setHasUnsavedDrafts(false);
                  onUnsavedDraftsChange?.(false);
                  setConfirmLeave(false);
                  router.replace(
                    stripEditParam(window.location.pathname + window.location.search),
                    { scroll: false }
                  );
                }}
              >
                确认退出
              </Button>
            </div>
          </div>
        </BaseDialog>
      </div>
    </div>
  );
}
