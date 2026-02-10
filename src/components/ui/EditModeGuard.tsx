'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import UnsavedChangesModal from './UnsavedChangesModal';

export interface EditModeGuardProps {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Function to save draft before leaving */
  onSaveDraft: () => void;
  /** Function to discard changes before leaving */
  onDiscardChanges: () => void;
  /** Function to exit edit mode (remove ?edit param) */
  onExitEditMode: () => void;
}

/**
 * Component that guards against accidental navigation when there are unsaved changes.
 * Handles both browser navigation (back/forward, close, refresh) and internal navigation.
 */
export default function EditModeGuard({
  isDirty,
  onSaveDraft,
  onDiscardChanges,
  onExitEditMode,
}: EditModeGuardProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle browser beforeunload event (close tab, refresh, etc.)
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers require returnValue to be set
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Intercept popstate (browser back/forward)
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = (e: PopStateEvent) => {
      // Push current state back to prevent immediate navigation
      e.preventDefault();

      // Get the URL we were trying to go to
      const currentUrl = window.location.href;

      // Push current state back to prevent the navigation
      window.history.pushState(null, '', currentUrl);

      // Show our custom modal
      setPendingNavigation('back');
      setShowModal(true);
    };

    // Push current state to handle back button
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);

  // Expose a function for the Link component to check before navigation
  useEffect(() => {
    if (!isDirty) {
      // Clean up if not dirty
      delete (window as unknown as { __editModeGuard?: unknown }).__editModeGuard;
      return;
    }

    // Expose navigation guard on window for Link component to use
    (
      window as unknown as {
        __editModeGuard: {
          isDirty: boolean;
          requestNavigation: (url: string) => boolean;
        };
      }
    ).__editModeGuard = {
      isDirty: true,
      requestNavigation: (url: string) => {
        // Show modal and store pending navigation
        setPendingNavigation(url);
        setShowModal(true);
        return false; // Prevent immediate navigation
      },
    };

    return () => {
      delete (window as unknown as { __editModeGuard?: unknown }).__editModeGuard;
    };
  }, [isDirty]);

  const handleSaveDraftAndLeave = useCallback(() => {
    setIsSaving(true);
    try {
      onSaveDraft();
      setShowModal(false);

      // Navigate after saving
      if (pendingNavigation === 'back') {
        // We pushed a state to intercept the back button, so go back 2 steps
        // to actually navigate to the previous page
        window.history.go(-2);
      } else if (pendingNavigation) {
        router.push(pendingNavigation);
      }

      onExitEditMode();
    } finally {
      setIsSaving(false);
      setPendingNavigation(null);
    }
  }, [onSaveDraft, pendingNavigation, router, onExitEditMode]);

  const handleDiscardAndLeave = useCallback(() => {
    onDiscardChanges();
    setShowModal(false);

    // Navigate after discarding
    if (pendingNavigation === 'back') {
      // We pushed a state to intercept the back button, so go back 2 steps
      // to actually navigate to the previous page
      window.history.go(-2);
    } else if (pendingNavigation) {
      router.push(pendingNavigation);
    }

    onExitEditMode();
    setPendingNavigation(null);
  }, [onDiscardChanges, pendingNavigation, router, onExitEditMode]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
    setPendingNavigation(null);
  }, []);

  return (
    <UnsavedChangesModal
      isOpen={showModal}
      onSaveDraftAndLeave={handleSaveDraftAndLeave}
      onDiscardAndLeave={handleDiscardAndLeave}
      onCancel={handleCancel}
      isSaving={isSaving}
    />
  );
}

/**
 * Check if edit mode guard is active and has unsaved changes.
 * Used by the Link component to intercept navigation.
 */
export function checkEditModeGuard(url: string): boolean {
  if (typeof window === 'undefined') return true;

  const guard = (
    window as unknown as {
      __editModeGuard?: {
        isDirty: boolean;
        requestNavigation: (url: string) => boolean;
      };
    }
  ).__editModeGuard;

  if (!guard || !guard.isDirty) return true;

  // Request navigation through the guard
  return guard.requestNavigation(url);
}
