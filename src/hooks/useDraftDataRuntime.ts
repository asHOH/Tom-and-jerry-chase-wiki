'use client';

import { useActiveEditRuntime, type ActiveEditRuntime } from '@/lib/edit/activeEditRuntime';
import { useEditMode } from '@/context/EditModeContext';

/** Returns the active edit runtime only when its draft data is safe to render. */
export function useDraftDataRuntime(): ActiveEditRuntime | null {
  const { isEditModeRequested, runtimeStatus } = useEditMode();
  const editRuntime = useActiveEditRuntime();

  return isEditModeRequested && runtimeStatus === 'ready' ? editRuntime : null;
}
