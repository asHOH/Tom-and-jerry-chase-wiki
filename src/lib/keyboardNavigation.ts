const editableSelector = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="searchbox"]',
].join(', ');

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.contentEditable === 'true')
  ) {
    return true;
  }

  return Boolean(target.closest(editableSelector));
}

export function shouldIgnorePageNavigationKey(
  event: KeyboardEvent,
  target: EventTarget | null = event.target
): boolean {
  return event.metaKey || event.ctrlKey || event.altKey || isEditableKeyboardTarget(target);
}
