import { render, screen } from '@testing-library/react';

import GameLayout from './GameLayout';

describe('GameLayout', () => {
  it('uses the wide page shell without adding another viewport gutter', () => {
    const { container } = render(
      <GameLayout title='小游戏' description='游戏说明'>
        <div>游戏内容</div>
      </GameLayout>
    );

    const shell = container.firstElementChild;
    expect(shell).toHaveClass('mx-auto', 'w-full', 'max-w-6xl', 'space-y-4', 'md:space-y-6');
    expect(shell).not.toHaveClass('p-3', 'md:p-6');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.getByText('游戏内容')).toBeInTheDocument();
  });

  it('merges shell class overrides', () => {
    const { container } = render(
      <GameLayout title='小游戏' className='max-w-4xl py-8'>
        游戏内容
      </GameLayout>
    );

    expect(container.firstElementChild).toHaveClass('max-w-4xl', 'py-8');
    expect(container.firstElementChild).not.toHaveClass('max-w-6xl');
  });
});
