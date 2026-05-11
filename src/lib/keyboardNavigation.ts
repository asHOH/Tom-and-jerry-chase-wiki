const editableRoles = new Set(['textbox', 'combobox', 'searchbox']);

const editableSelector = [
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="searchbox"]',
].join(', ');

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }

  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.contentEditable === 'true')
  ) {
    return true;
  }

  const role = target.getAttribute('role');
  if (role && editableRoles.has(role)) return true;

  return Boolean(target.closest(editableSelector));
}

export function shouldIgnorePageNavigationKey(
  event: KeyboardEvent,
  target: EventTarget | null = event.target
): boolean {
  return event.metaKey || event.ctrlKey || event.altKey || isEditableKeyboardTarget(target);
}
