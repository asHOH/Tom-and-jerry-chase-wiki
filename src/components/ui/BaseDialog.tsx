'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';

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

  backdropClassName?: string;
  panelClassName?: string;

  portal?: boolean;
};

let scrollLockCount = 0;
let previousOverflow: string | null = null;
const activeDialogPanels: HTMLDivElement[] = [];

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
  backdropClassName,
  panelClassName,
  portal = true,
}: BaseDialogProps) {
  const shouldReduceMotion = useReducedMotion();
  const fallbackTitleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const activeElementBeforeOpenRef = useRef<HTMLElement | null>(null);
  const [dialogDepth, setDialogDepth] = useState(0);

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

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (panel) {
      setDialogDepth(activeDialogPanels.length);
      activeDialogPanels.push(panel);
    }
    activeElementBeforeOpenRef.current = document.activeElement as HTMLElement | null;
    if (lockScroll) lockBodyScroll();

    queueMicrotask(() => {
      const panel = panelRef.current;
      if (!panel?.contains(document.activeElement)) {
        panel?.focus();
      }
    });

    return () => {
      if (panel) {
        const index = activeDialogPanels.indexOf(panel);
        if (index !== -1) activeDialogPanels.splice(index, 1);
      }
      if (lockScroll) unlockBodyScroll();
      activeElementBeforeOpenRef.current?.focus?.();
      activeElementBeforeOpenRef.current = null;
    };
  }, [open, lockScroll]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel || activeDialogPanels.at(-1) !== panel) return;

      if (e.key === 'Escape' && closeOnEsc) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenChange(false, 'escape');
      } else if (e.key === 'Tab') {
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'
          )
        ).filter((element) => {
          const style = window.getComputedStyle(element);
          return (
            element.tabIndex >= 0 &&
            element.getClientRects().length > 0 &&
            !element.matches(':disabled') &&
            !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          );
        });
        const first = focusable[0];
        const last = focusable.at(-1);
        const current = document.activeElement;

        if (!first || !last) {
          e.preventDefault();
          panel.focus();
        } else if (
          e.shiftKey &&
          (current === first || !focusable.includes(current as HTMLElement))
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (current === last || !focusable.includes(current as HTMLElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEsc, onOpenChange]);

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            key='backdrop'
            className={cn(
              'fixed inset-0 z-(--wiki-layer-backdrop) bg-black/40 backdrop-blur-sm',
              backdropClassName
            )}
            aria-hidden='true'
            style={{ zIndex: `calc(var(--wiki-layer-backdrop) + ${dialogDepth * 20})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onMouseDown={(e) => {
              if (!closeOnOutsideClick) return;
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
            style={{ zIndex: `calc(var(--wiki-layer-dialog) + ${dialogDepth * 20})` }}
            className={cn(
              'bg-surface-raised text-foreground fixed inset-4 z-(--wiki-layer-dialog) min-w-0 overflow-hidden rounded-xl shadow-xl md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-2rem)] md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:transform',
              panelClassName
            )}
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* If caller didn't provide ariaLabelledBy or ariaLabel, we still need a title element id.
                We can't infer it automatically, but this keeps aria-labelledby valid if caller uses the generated id. */}
            {!ariaLabel && !ariaLabelledBy ? (
              <span id={fallbackTitleId} className='sr-only'>
                对话框
              </span>
            ) : null}
            {children}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!portal) return content;
  if (typeof document === 'undefined') return null;

  return createPortal(content, document.body);
}
