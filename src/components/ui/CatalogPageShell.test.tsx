import { render, screen } from '@testing-library/react';

import CatalogPageShell from './CatalogPageShell';

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

afterAll(() => {
  if (originalMatchMedia) {
    Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    return;
  }

  delete (window as Partial<typeof window>).matchMedia;
});

describe('CatalogPageShell', () => {
  it('renders title, description, filters, actions, and content', () => {
    render(
      <CatalogPageShell
        title='Page title'
        description='Page description'
        actions={<button type='button'>Export</button>}
        filters={<div>Filters</div>}
      >
        <div>Page content</div>
      </CatalogPageShell>
    );

    expect(screen.getByText('Page title')).toBeInTheDocument();
    expect(screen.getByText('Page description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('omits optional sections when not provided', () => {
    render(
      <CatalogPageShell title='Title only'>
        <div>Content</div>
      </CatalogPageShell>
    );

    expect(screen.getByText('Title only')).toBeInTheDocument();
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies desktop-only description classes', () => {
    render(
      <CatalogPageShell
        title='Title'
        description='Desktop description'
        descriptionVisibility='desktop'
      >
        <div>Content</div>
      </CatalogPageShell>
    );

    const descriptionWrapper = screen.getByText('Desktop description').parentElement;
    expect(descriptionWrapper).toHaveClass('sr-only', 'md:not-sr-only');
  });

  it('uses content spacing as the shell gap source by default', () => {
    const { container } = render(
      <CatalogPageShell title='Title'>
        <div>Content</div>
      </CatalogPageShell>
    );

    const section = container.querySelector('section');
    const header = container.querySelector('header');
    const contentWrapper = screen.getByText('Content').parentElement;

    expect(section).not.toHaveClass('space-y-2', 'md:space-y-8');
    expect(header).not.toHaveClass('mb-4', 'md:mb-8');
    expect(contentWrapper).toHaveClass('mt-8');
  });

  it('skips shell top spacing when contentTopSpacing is none', () => {
    render(
      <CatalogPageShell title='Title' contentTopSpacing='none'>
        <div>Content</div>
      </CatalogPageShell>
    );

    const contentWrapper = screen.getByText('Content').parentElement;
    expect(contentWrapper).not.toHaveClass('mt-8');
  });

  it('merges class overrides with cn', () => {
    const { container } = render(
      <CatalogPageShell
        title='Title'
        filters={<div>Filters</div>}
        className='max-w-4xl'
        headerClassName='mb-2'
        filtersClassName='max-w-xl'
        contentClassName='pt-2'
      >
        <div>Content</div>
      </CatalogPageShell>
    );

    const section = container.querySelector('section');
    const header = container.querySelector('header');
    const filtersWrapper = screen.getByText('Filters').parentElement;
    const contentWrapper = screen.getByText('Content').parentElement;

    expect(section).toHaveClass('max-w-4xl');
    expect(section).not.toHaveClass('max-w-6xl');
    expect(header).toHaveClass('mb-2');
    expect(filtersWrapper).toHaveClass('max-w-xl');
    expect(filtersWrapper).not.toHaveClass('max-w-2xl');
    expect(contentWrapper).toHaveClass('pt-2');
  });
});
