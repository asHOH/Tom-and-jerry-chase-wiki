import { fireEvent, render, screen } from '@testing-library/react';

import CharacterSection from './CharacterSection';

jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('CharacterSection', () => {
  it('exposes a stable section permalink without toggling the section', () => {
    render(
      <CharacterSection title='技能描述'>
        <div>技能内容</div>
      </CharacterSection>
    );

    const permalink = screen.getByRole('link', { name: '链接到技能描述' });
    const heading = screen.getByRole('heading', { name: '技能描述' });
    expect(permalink).toHaveAttribute('href', '#Section:技能描述');
    expect(permalink.closest('[id]')).toHaveAttribute('id', 'Section:技能描述');
    expect(heading).toHaveProperty('tagName', 'H2');
    expect(heading).toContainElement(screen.getByRole('button', { name: '技能描述' }));
    expect(heading.nextElementSibling).toBe(permalink);
    expect(screen.getByRole('button', { name: '折叠技能描述' })).toBeInTheDocument();

    fireEvent.click(permalink);
    expect(screen.getByText('技能内容')).toBeVisible();
  });
});
