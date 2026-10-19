'use client';

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { tabbable } from 'tabbable';

import { cn } from '@/lib/design';

type DialogCloseReason = 'escape' | 'backdrop' | 'close-button' | 'programmatic';

export type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean, reason?: DialogCloseReason) => void;

  children: ReactNode;

  role?: 'dialog' | 'alertdialog';
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;

  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;

  size?: keyof typeof dialogSizes;
  fullScreen?: boolean;

  backdropClassName?: string;
  panelClassName?: string;

  portal?: boolean;
};

const dialogSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

type DialogEntry = {
  panel: HTMLDivElement;
  ancestors: readonly RefObject<HTMLDivElement | null>[];
  returnFocus: HTMLElement | null;
};

const DialogAncestors = createContext<DialogEntry['ancestors']>([]);
const openDialogs: DialogEntry[] = [];

function updateDialogLayers() {
  openDialogs.forEach(({ panel }, index) => {
    const layer = 10000 + index * 2;
    panel.style.zIndex = String(layer);
    if (panel.previousElementSibling instanceof HTMLElement) {
      panel.previousElementSibling.style.zIndex = String(layer - 1);
    }
  });
}

let scrollLockCount = 0;
let previousOverflow: string | null = null;

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  scrollLockCount += 1;
  if (scrollLockCount !== 1) return;

  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount !== 0) return;

  document.body.style.overflow = previousOverflow ?? '';
  previousOverflow = null;
}

export function BaseDialog({
  open,
  onOpenChange,
  children,
  role = 'dialog',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  lockScroll = true,
  size = 'md',
  fullScreen = false,
  backdropClassName,
  panelClassName,
  portal = true,
}: BaseDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const fallbackTitleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const activeElementBeforeOpenRef = useRef<HTMLElement | null>(null);
  const ancestors = useContext(DialogAncestors);
  const descendantAncestors = useMemo(() => [...ancestors, panelRef], [ancestors]);

  const effectiveLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : fallbackTitleId);

  const backdropTransition = shouldReduceMotion
    ? ({ duration: 0.01 } as const)
    : ({ duration: 0.18 } as const);

  const panelTransition = shouldReduceMotion
    ? ({ duration: 0.01 } as const)
    : ({ type: 'spring' as const, stiffness: 420, damping: 34, mass: 0.9 } as const);

  const panelInitial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 };
  const panelAnimate = shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 };
  const panelExit = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 4 };

  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (closeOnEsc && !event.defaultPrevented) {
      event.preventDefault();
      onOpenChange(false, 'escape');
    }
  });

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;
    activeElementBeforeOpenRef.current ??= panel.contains(document.activeElement)
      ? null
      : (document.activeElement as HTMLElement | null);
    const entry = { panel, ancestors, returnFocus: activeElementBeforeOpenRef.current };
    // Child effects can run first when nested dialogs mount together.
    const descendantIndex = openDialogs.findIndex((dialog) =>
      dialog.ancestors.some((ancestor) => ancestor.current === panel)
    );
    openDialogs.splice(descendantIndex < 0 ? openDialogs.length : descendantIndex, 0, entry);
    updateDialogLayers();
    if (lockScroll) lockBodyScroll();

    let active = true;
    queueMicrotask(() => {
      if (active && openDialogs.at(-1) === entry && !panel.contains(document.activeElement)) {
        panel.focus({ preventScroll: true });
      }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogs.at(-1) !== entry) return;
      if (event.key === 'Escape') handleEscape(event);
      if (
        event.key !== 'Tab' ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !panel.contains(document.activeElement)
      )
        return;
      const candidates = tabbable(panel);
      const first = candidates[0];
      const last = candidates.at(-1);
      const focused = document.activeElement;
      if (!first || focused === panel || (event.shiftKey ? focused === first : focused === last)) {
        event.preventDefault();
        (event.shiftKey ? (last ?? panel) : (first ?? panel)).focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      active = false;
      document.removeEventListener('keydown', onKeyDown);
      const wasTop = openDialogs.at(-1) === entry;
      openDialogs.splice(openDialogs.indexOf(entry), 1);
      updateDialogLayers();
      if (lockScroll) unlockBodyScroll();
      const target = entry.returnFocus;
      for (const dialog of openDialogs) {
        if (panel.contains(dialog.returnFocus)) dialog.returnFocus = target;
      }
      if (wasTop) {
        const remainingPanel = openDialogs.at(-1)?.panel;
        if (target?.isConnected && (!remainingPanel || remainingPanel.contains(target))) {
          target.focus({ preventScroll: true });
        } else {
          remainingPanel?.focus({ preventScroll: true });
        }
      }
      activeElementBeforeOpenRef.current = null;
    };
  }, [open, lockScroll, ancestors]);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key='backdrop'
            className={cn('fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm', backdropClassName)}
            aria-hidden='true'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onMouseDown={(e) => {
              if (!closeOnOutsideClick || openDialogs.at(-1)?.panel !== panelRef.current) return;
              if (e.target === e.currentTarget) {
                onOpenChange(false, 'backdrop');
              }
            }}
          />

          <m.div
            key='panel'
            ref={panelRef}
            tabIndex={-1}
            role={role}
            aria-modal='true'
            aria-label={ariaLabel}
            aria-labelledby={effectiveLabelledBy}
            aria-describedby={ariaDescribedBy}
            className={cn(
              'bg-surface-raised text-foreground fixed z-10000 overflow-y-auto rounded-xl shadow-xl',
              fullScreen
                ? 'inset-0 h-dvh w-full rounded-none'
                : cn(
                    'inset-auto top-1/2 left-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
                    dialogSizes[size]
                  ),
              panelClassName
            )}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            onMouseDown={(e) => e.stopPropagation()}
            onFocusCapture={(event) => {
              if (
                !openDialogs.some(({ panel }) => panel === event.currentTarget) &&
                event.relatedTarget instanceof HTMLElement &&
                !event.currentTarget.contains(event.relatedTarget)
              ) {
                activeElementBeforeOpenRef.current = event.relatedTarget;
              }
            }}
          >
            {!ariaLabel && !ariaLabelledBy ? (
              <span id={fallbackTitleId} className='sr-only'>
                对话框
              </span>
            ) : null}
            <DialogAncestors value={descendantAncestors}>{children}</DialogAncestors>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!portal) return content;
  if (typeof document === 'undefined') return null;

  return createPortal(content, document.body);
}
