import { render } from '@testing-library/react';

import { SkeletonArticleCard, SkeletonItemCard } from './Skeleton';

describe('Skeleton card surfaces', () => {
  it('uses the shared semantic card shell for catalog skeletons', () => {
    const { container } = render(<SkeletonItemCard animate={false} />);

    expect(container.firstElementChild).toHaveClass(
      'bg-surface',
      'border',
      'border-border',
      'shadow-sm'
    );
  });

  it('uses the shared semantic card surface for article skeletons', () => {
    const { container } = render(<SkeletonArticleCard animate={false} />);

    expect(container.firstElementChild).toHaveClass('bg-surface', 'border', 'border-border');
  });
});
