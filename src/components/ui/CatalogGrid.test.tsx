import { render, screen } from '@testing-library/react';

import { CatalogGridItem, getCatalogGridRowClassName } from './CatalogGrid';

describe('CatalogGrid', () => {
  describe('getCatalogGridRowClassName', () => {
    it('keeps the shared catalog row hooks by default', () => {
      expect(getCatalogGridRowClassName().split(/\s+/)).toEqual(
        expect.arrayContaining(['auto-fit-grid', 'grid-container', 'grid'])
      );
    });

    it('merges custom row classes without dropping shared hooks', () => {
      expect(getCatalogGridRowClassName('gap-4').split(/\s+/)).toEqual(
        expect.arrayContaining(['auto-fit-grid', 'grid-container', 'grid', 'gap-4'])
      );
    });
  });

  it('preserves item hooks and supports optional clipping and custom classes', () => {
    const { rerender } = render(
      <CatalogGridItem data-testid='catalog-item'>Content</CatalogGridItem>
    );

    const item = screen.getByTestId('catalog-item');
    expect(item).toHaveClass('character-card');
    expect(item).not.toHaveClass('overflow-hidden');
    expect(item).toHaveTextContent('Content');

    rerender(
      <CatalogGridItem clip className='p-2' data-testid='catalog-item'>
        Content
      </CatalogGridItem>
    );

    expect(item).toHaveClass('character-card', 'overflow-hidden', 'p-2');
    expect(item).toHaveTextContent('Content');
  });
});
