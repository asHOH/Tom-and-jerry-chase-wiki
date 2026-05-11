import { shouldIgnorePageNavigationKey } from './keyboardNavigation';

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

    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), input)).toBe(true);
    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), textarea)).toBe(true);
    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), select)).toBe(true);
    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), contentEditable)).toBe(true);
    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), searchbox)).toBe(true);
    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), plainElement)).toBe(false);
    expect(shouldIgnorePageNavigationKey(new KeyboardEvent('keydown'), null)).toBe(false);
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
