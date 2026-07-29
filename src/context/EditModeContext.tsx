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
import { isEditModeSearchParamEnabled } from '@/hooks/useSearchParamEditMode';

const EditRuntime = dynamic(() => import('@/components/EditRuntime'), {
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
  /** Published revision used to render the visible route data. */
  publishedRevision?: `v1:${string}`;
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
      | 'publishedRevision'
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
  const [visibleRevision, setVisibleRevision] = useState<`v1:${string}` | undefined>();
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
    setVisibleRevision(undefined);
    setIsPreviewMode(false);
    if (isEditModeRequested) {
      setRuntimeStatus('loading');
      setRuntimeError(undefined);
    }
  }, [isEditModeRequested, pathname]);

  useEffect(() => {
    try {
      window.localStorage.setItem('isEditMode', JSON.stringify(isEditModeRequested));
      if (isEditModeRequested) {
        window.localStorage.setItem('editmode:enabledAt', String(Date.now()));
      }
    } catch (error) {
      console.error('Failed to persist edit mode state:', error);
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
    setVisibleRevision(revision);
    return () => {
      setVisibleRevision((current) => (current === revision ? undefined : current));
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
      ...(visibleRevision === undefined ? {} : { publishedRevision: visibleRevision }),
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
      visibleRevision,
    ]
  );

  return (
    <EditModeContext.Provider value={contextValue}>
      {children}
      {isEditModeRequested ? (
        <EditRuntime
          key={retryKey}
          {...(visibleRevision === undefined ? {} : { visibleRevision })}
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
