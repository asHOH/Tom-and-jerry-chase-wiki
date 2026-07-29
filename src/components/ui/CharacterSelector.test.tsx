import { fireEvent, render, screen } from '@testing-library/react';

import { ArticleCharacterSelector } from './CharacterSelector';

describe('ArticleCharacterSelector', () => {
  it('offers characters from the published route projection', () => {
    const onSelect = jest.fn();

    render(
      <ArticleCharacterSelector
        characters={[{ id: '__published_article_character__', factionId: 'mouse' }]}
        selectedCharacterId={null}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '选择角色' }));
    fireEvent.click(screen.getByRole('button', { name: /__published_article_character__/ }));

    expect(onSelect).toHaveBeenCalledWith('__published_article_character__');
  });
});
