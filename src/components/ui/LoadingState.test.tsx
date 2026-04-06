import { render, screen } from '@testing-library/react';

import LoadingState, { PageLoadingState } from './LoadingState';

jest.mock('./LoadingSpinner', () => ({
  __esModule: true,
  default: function MockLoadingSpinner({
    message,
    size,
  }: {
    message?: string;
    size?: string;
  }) {
    return <div data-testid='loading-spinner' data-message={message ?? ''} data-size={size ?? ''} />;
  },
}));

jest.mock('./Skeleton', () => ({
  __esModule: true,
  Skeleton: function MockSkeleton({ animate }: { animate?: boolean }) {
    return <div data-testid='skeleton' data-animate={String(animate ?? true)} />;
  },
  SkeletonBuffCard: function MockSkeletonBuffCard({ animate }: { animate?: boolean }) {
    return <div data-testid='skeleton-buff-card' data-animate={String(animate ?? true)} />;
  },
  SkeletonCharacterCard: function MockSkeletonCharacterCard({ animate }: { animate?: boolean }) {
    return <div data-testid='skeleton-character-card' data-animate={String(animate ?? true)} />;
  },
  SkeletonCharacterDetail: function MockSkeletonCharacterDetail({ animate }: { animate?: boolean }) {
    return <div data-testid='skeleton-character-detail' data-animate={String(animate ?? true)} />;
  },
  SkeletonDetailLayout: function MockSkeletonDetailLayout({
    animate,
    sectionCount,
  }: {
    animate?: boolean;
    sectionCount?: number;
  }) {
    return (
      <div
        data-testid='skeleton-detail-layout'
        data-animate={String(animate ?? true)}
        data-section-count={String(sectionCount ?? 0)}
      />
    );
  },
  SkeletonItemCard: function MockSkeletonItemCard({ animate }: { animate?: boolean }) {
    return <div data-testid='skeleton-item-card' data-animate={String(animate ?? true)} />;
  },
  SkeletonKnowledgeCard: function MockSkeletonKnowledgeCard({ animate }: { animate?: boolean }) {
    return <div data-testid='skeleton-knowledge-card' data-animate={String(animate ?? true)} />;
  },
}));

describe('LoadingState', () => {
  it('renders spinner type by default', () => {
    render(<LoadingState />);

    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-message', '加载中...');
  });

  it('renders a custom spinner message', () => {
    render(<LoadingState message='Custom loading message' />);

    expect(screen.getByTestId('loading-spinner')).toHaveAttribute(
      'data-message',
      'Custom loading message'
    );
  });

  it('renders character-grid skeleton cards and a compact spinner', () => {
    render(<LoadingState type='character-grid' count={3} />);

    expect(screen.getAllByTestId('skeleton-character-card')).toHaveLength(3);
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'sm');
  });

  it('renders knowledge-card skeleton cards and a compact spinner', () => {
    render(<LoadingState type='knowledge-cards' count={4} />);

    expect(screen.getAllByTestId('skeleton-knowledge-card')).toHaveLength(4);
    expect(screen.getByTestId('loading-spinner')).toHaveAttribute('data-size', 'sm');
  });

  it('renders item-grid skeleton cards without the spinner footer', () => {
    render(<LoadingState type='item-grid' count={5} />);

    expect(screen.getAllByTestId('skeleton-item-card')).toHaveLength(5);
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('renders buff-grid skeleton cards without the spinner footer', () => {
    render(<LoadingState type='buff-grid' count={2} />);

    expect(screen.getAllByTestId('skeleton-buff-card')).toHaveLength(2);
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('renders the character-detail skeleton branch', () => {
    render(<LoadingState type='character-detail' />);

    expect(screen.getByTestId('skeleton-character-detail')).toBeInTheDocument();
  });

  it('renders the detail-layout skeleton branch', () => {
    render(<LoadingState type='detail' />);

    expect(screen.getByTestId('skeleton-detail-layout')).toHaveAttribute('data-section-count', '3');
  });

  it('renders the requested number of generic skeleton rows', () => {
    render(<LoadingState type='skeleton' count={5} />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(5);
  });

  it('passes animate=false through to skeleton rows', () => {
    render(<LoadingState type='skeleton' count={2} animate={false} />);

    screen.getAllByTestId('skeleton').forEach((row) => {
      expect(row).toHaveAttribute('data-animate', 'false');
    });
  });
});

describe('PageLoadingState', () => {
  it('renders the requested loading branch when children are absent', () => {
    render(<PageLoadingState type='character-grid' />);

    expect(screen.getAllByTestId('skeleton-character-card')).toHaveLength(8);
  });

  it('renders custom children instead of the default loading state', () => {
    render(
      <PageLoadingState>
        <div data-testid='custom-loading'>Custom loading content</div>
      </PageLoadingState>
    );

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
