import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';

import {
  clearActiveEditRuntime,
  installActiveEditRuntime,
  type ActiveEditRuntime,
} from '@/lib/edit/activeEditRuntime';
import { EditModeContext } from '@/context/EditModeContext';

import { useDraftDataRuntime } from './useDraftDataRuntime';

const runtime = {
  stores: {},
  registry: {},
  revision: 'v1:test',
} as unknown as ActiveEditRuntime;

type WrapperState = {
  isEditMode: boolean;
  isEditModeRequested: boolean;
  runtimeStatus: 'idle' | 'loading' | 'restoring' | 'refreshing' | 'ready' | 'error';
  isPreviewMode?: boolean;
};

function createWrapper({
  isEditMode,
  isEditModeRequested,
  runtimeStatus,
  isPreviewMode = false,
}: WrapperState) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <EditModeContext
        value={{
          isEditMode,
          isEditModeRequested,
          runtimeStatus,
          isLoading: runtimeStatus !== 'idle' && runtimeStatus !== 'ready',
          isPreviewMode,
          setIsPreviewMode: jest.fn(),
        }}
      >
        {children}
      </EditModeContext>
    );
  };
}

describe('useDraftDataRuntime', () => {
  beforeEach(() => installActiveEditRuntime(runtime));
  afterEach(() => clearActiveEditRuntime(runtime));

  it.each(['loading', 'restoring', 'refreshing', 'error'] as const)(
    'hides an installed runtime while status is %s',
    (runtimeStatus) => {
      const { result } = renderHook(() => useDraftDataRuntime(), {
        wrapper: createWrapper({
          isEditMode: false,
          isEditModeRequested: true,
          runtimeStatus,
        }),
      });

      expect(result.current).toBeNull();
    }
  );

  it('returns the runtime while editing', () => {
    const { result } = renderHook(() => useDraftDataRuntime(), {
      wrapper: createWrapper({
        isEditMode: true,
        isEditModeRequested: true,
        runtimeStatus: 'ready',
      }),
    });

    expect(result.current).toBe(runtime);
  });

  it('returns the runtime for read-only preview', () => {
    const { result } = renderHook(() => useDraftDataRuntime(), {
      wrapper: createWrapper({
        isEditMode: false,
        isEditModeRequested: true,
        runtimeStatus: 'ready',
        isPreviewMode: true,
      }),
    });

    expect(result.current).toBe(runtime);
  });

  it('hides the runtime outside an edit request', () => {
    const { result } = renderHook(() => useDraftDataRuntime(), {
      wrapper: createWrapper({
        isEditMode: false,
        isEditModeRequested: false,
        runtimeStatus: 'idle',
      }),
    });

    expect(result.current).toBeNull();
  });
});
