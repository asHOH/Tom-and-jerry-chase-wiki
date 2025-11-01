'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function isEditableElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const target = el;
  if (target instanceof HTMLInputElement) return !target.readOnly && !target.disabled;
  if (target instanceof HTMLTextAreaElement) return !target.readOnly && !target.disabled;
  if (target.isContentEditable) return true;
  const role = target.getAttribute?.('role');
  if (role === 'textbox' || role === 'combobox' || role === 'searchbox') return true;
  return false;
}

export default function KeyboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableElement(e.target)) return;

      e.preventDefault();
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }

    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return null;
}
