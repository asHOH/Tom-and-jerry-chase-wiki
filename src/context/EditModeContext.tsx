'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';

import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import { storage, StorageKey } from '@/lib/localStorage';
import { isEditModeSearchParamEnabled } from '@/hooks/useSearchParamEditMode';
import { editRuntimeModule } from '@/components/panelModules';

const EditRuntime = dynamic(editRuntimeModule.load, {
  ssr: false,
});

type EditModeContextType = {
  /** Whether the edit runtime is ready and editing is active. */
  isEditMode: boolean;
  /** Whether ?edit=1 requested edit mode. */
  isEditModeRequested: boolean;
  /** Loading state during runtime initialization. */
  isLoading: boolean;
  /** Runtime initialization state. */
  runtimeStatus: EditRuntimeStatus;
  /** Retryable runtime error shown while editing is disabled. */
  runtimeError?: string;
  /** Whether the page is in preview mode. */
  isPreviewMode: boolean;
  /** Set preview mode. */
  setIsPreviewMode: (value: boolean) => void;
  /** Revisions of all published domains used by the visible route and its layouts. */
  publishedRevisions?: readonly `v1:${string}`[];
  /** Register the revision carried by an edit-capable route shell. */
  registerPublishedRevision: (revision: `v1:${string}`) => () => void;
  /** Retry lazy runtime initialization after a recoverable failure. */
  retryEditRuntime: () => void;
};

type EditModeContextInput = Pick<
  EditModeContextType,
  'isEditMode' | 'isLoading' | 'isPreviewMode' | 'setIsPreviewMode'
> &
  Partial<
    Pick<
      EditModeContextType,
      | 'isEditModeRequested'
      | 'runtimeStatus'
      | 'runtimeError'
      | 'publishedRevisions'
      | 'registerPublishedRevision'
      | 'retryEditRuntime'
    >
  >;

export const EditModeContext = createContext<EditModeContextInput | undefined>(undefined);

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [runtimeStatus, setRuntimeStatus] = useState<EditRuntimeStatus>('idle');
  const [runtimeError, setRuntimeError] = useState<string | undefined>();
  const [revisionCounts, setRevisionCounts] = useState<ReadonlyMap<`v1:${string}`, number>>(
    () => new Map()
  );
  const visibleRevisions = useMemo(() => [...revisionCounts.keys()].sort(), [revisionCounts]);
  const [retryKey, setRetryKey] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const previousPathnameRef = useRef(pathname);
  const hasReadyRuntimeRef = useRef(false);

  const isEditModeRequested = useMemo(
    () => isEditModeSearchParamEnabled(searchParams),
    [searchParams]
  );
  const isEditMode = isEditModeRequested && runtimeStatus === 'ready';
  const isLoading =
    isEditModeRequested &&
    (runtimeStatus === 'idle' ||
      runtimeStatus === 'loading' ||
      runtimeStatus === 'refreshing' ||
      runtimeStatus === 'restoring');

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    // The route shell owns the revision lifecycle. Clearing it here can run after the
    // incoming shell registers and discard the new route's revision.
    setIsPreviewMode(false);
    if (isEditModeRequested) {
      setRuntimeStatus('loading');
      setRuntimeError(undefined);
    }
  }, [isEditModeRequested, pathname]);

  useEffect(() => {
    const persisted =
      storage.setJson(StorageKey.EditMode, isEditModeRequested) &&
      (!isEditModeRequested || storage.setItem(StorageKey.EditModeEnabledAt, String(Date.now())));
    if (!persisted) {
      console.error('Failed to persist edit mode state.');
    }

    window.dispatchEvent(
      new CustomEvent('editmode:changed', {
        detail: { isEditMode: isEditModeRequested },
      })
    );

    if (!isEditModeRequested) {
      hasReadyRuntimeRef.current = false;
      setRuntimeStatus('idle');
      setRuntimeError(undefined);
    }
  }, [isEditModeRequested]);

  const registerPublishedRevision = useCallback((revision: `v1:${string}`) => {
    setRevisionCounts((current) => {
      const next = new Map(current);
      next.set(revision, (next.get(revision) ?? 0) + 1);
      return next;
    });
    return () => {
      setRevisionCounts((current) => {
        const next = new Map(current);
        const count = next.get(revision) ?? 0;
        if (count <= 1) next.delete(revision);
        else next.set(revision, count - 1);
        return next;
      });
    };
  }, []);

  const handleRuntimeStatusChange = useCallback((status: EditRuntimeStatus, error?: string) => {
    if (status === 'ready') {
      hasReadyRuntimeRef.current = true;
    }
    setRuntimeStatus(status);
    setRuntimeError(error);
  }, []);

  const retryEditRuntime = useCallback(() => {
    if (hasReadyRuntimeRef.current) {
      return;
    }
    setRuntimeError(undefined);
    setRuntimeStatus('loading');
    setRetryKey((current) => current + 1);
  }, []);

  const contextValue = useMemo<EditModeContextType>(
    () => ({
      isEditMode,
      isEditModeRequested,
      isLoading,
      runtimeStatus,
      ...(runtimeError === undefined ? {} : { runtimeError }),
      isPreviewMode,
      setIsPreviewMode,
      publishedRevisions: visibleRevisions,
      registerPublishedRevision,
      retryEditRuntime,
    }),
    [
      isEditMode,
      isEditModeRequested,
      isLoading,
      isPreviewMode,
      registerPublishedRevision,
      retryEditRuntime,
      runtimeError,
      runtimeStatus,
      visibleRevisions,
    ]
  );

  return (
    <EditModeContext.Provider value={contextValue}>
      {children}
      {isEditModeRequested ? (
        <EditRuntime
          key={retryKey}
          visibleRevisions={visibleRevisions}
          onStatusChange={handleRuntimeStatusChange}
          onRetry={retryEditRuntime}
        />
      ) : null}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return {
    ...context,
    isEditModeRequested: context.isEditModeRequested ?? context.isEditMode,
    runtimeStatus: context.runtimeStatus ?? (context.isEditMode ? 'ready' : 'idle'),
    registerPublishedRevision: context.registerPublishedRevision ?? (() => () => undefined),
    retryEditRuntime: context.retryEditRuntime ?? (() => undefined),
  } satisfies EditModeContextType;
};
