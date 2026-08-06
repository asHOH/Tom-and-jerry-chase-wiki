import { resolveArticleCategoryPolicy } from './articleCategoryPolicy';

const categories = [
  { id: 'root', parent_category_id: null, requires_character: true },
  { id: 'child', parent_category_id: 'root', requires_character: false },
  { id: 'other', parent_category_id: null, requires_character: false },
];

describe('resolveArticleCategoryPolicy', () => {
  it('inherits the character requirement from ancestors', () => {
    expect(resolveArticleCategoryPolicy(categories, 'child')).toEqual({
      requiresCharacter: true,
    });
  });

  it('returns a non-required policy for ordinary categories', () => {
    expect(resolveArticleCategoryPolicy(categories, 'other')).toEqual({
      requiresCharacter: false,
    });
  });

  it('returns null for unknown categories and terminates on cycles', () => {
    expect(resolveArticleCategoryPolicy(categories, 'missing')).toBeNull();
    expect(
      resolveArticleCategoryPolicy(
        [
          { id: 'a', parent_category_id: 'b', requires_character: false },
          { id: 'b', parent_category_id: 'a', requires_character: false },
        ],
        'a'
      )
    ).toEqual({ requiresCharacter: false });
  });
});
