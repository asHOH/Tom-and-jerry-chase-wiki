import { isEditableKeyboardTarget, shouldIgnorePageNavigationKey } from './keyboardNavigation';

describe('keyboardNavigation', () => {
  it('should identify editable keyboard targets', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const contentEditable = document.createElement('div');
    const searchbox = document.createElement('div');
    const plainElement = document.createElement('div');

    contentEditable.contentEditable = 'true';
    searchbox.setAttribute('role', 'searchbox');

    expect(isEditableKeyboardTarget(input)).toBe(true);
    expect(isEditableKeyboardTarget(textarea)).toBe(true);
    expect(isEditableKeyboardTarget(select)).toBe(true);
    expect(isEditableKeyboardTarget(contentEditable)).toBe(true);
    expect(isEditableKeyboardTarget(searchbox)).toBe(true);
    expect(isEditableKeyboardTarget(plainElement)).toBe(false);
    expect(isEditableKeyboardTarget(null)).toBe(false);
  });

  it('should ignore page navigation keys from editable targets or modifier chords', () => {
    const input = document.createElement('input');
    const plainElement = document.createElement('div');

    expect(
      shouldIgnorePageNavigationKey(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), input)
    ).toBe(true);
    expect(
      shouldIgnorePageNavigationKey(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true }),
        plainElement
      )
    ).toBe(true);
    expect(
      shouldIgnorePageNavigationKey(
        new KeyboardEvent('keydown', { key: 'ArrowLeft' }),
        plainElement
      )
    ).toBe(false);
  });
});
