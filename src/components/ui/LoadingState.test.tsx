import { render, screen } from '@testing-library/react';

import LoadingState, { PageLoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders spinner type by default', () => {
    render(<LoadingState />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message='自定义加载消息' />);
    expect(screen.getByText('自定义加载消息')).toBeInTheDocument();
  });

  it('renders character-grid type with correct elements', () => {
    const { container } = render(<LoadingState type='character-grid' />);

    // Should have grid layout
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4');
  });

  it('renders knowledge-cards type with correct elements', () => {
    const { container } = render(<LoadingState type='knowledge-cards' />);

    // Should have grid layout for cards
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveClass(
      'grid-cols-2',
      'sm:grid-cols-3',
      'md:grid-cols-4',
      'lg:grid-cols-5',
      'xl:grid-cols-6'
    );
  });

  it('renders character-detail type', () => {
    const { container } = render(<LoadingState type='character-detail' />);

    // Should have character detail skeleton structure
    expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
  });

  it('renders skeleton type with custom count', () => {
    const { container } = render(<LoadingState type='skeleton' count={5} />);

    // Should have 5 skeleton lines
    const skeletons = container.querySelectorAll('.bg-gray-200');
    expect(skeletons).toHaveLength(5);
  });

  it('can disable animation', () => {
    const { container } = render(<LoadingState type='skeleton' animate={false} />);

    // Should not have animate-pulse class
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});

describe('PageLoadingState', () => {
  it('renders with correct page layout', () => {
    const { container } = render(<PageLoadingState />);

    // Should have page container classes
    const pageContainer = container.querySelector('.max-w-6xl');
    expect(pageContainer).toBeInTheDocument();
    expect(pageContainer).toHaveClass('mx-auto', 'p-6', 'space-y-6');
  });

  it('renders with custom type', () => {
    const { container } = render(<PageLoadingState type='character-grid' />);

    // Should render character grid loading
    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders custom children', () => {
    render(
      <PageLoadingState>
        <div data-testid='custom-loading'>Custom loading content</div>
      </PageLoadingState>
    );

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
  });
});
