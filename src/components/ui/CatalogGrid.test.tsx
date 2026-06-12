import { render, screen } from '@testing-library/react';

import {
  CatalogGridItem,
  getCatalogGridItemClassName,
  getCatalogGridRowClassName,
} from './CatalogGrid';

describe('CatalogGrid', () => {
  describe('getCatalogGridRowClassName', () => {
    it('keeps the shared catalog row hooks by default', () => {
      expect(getCatalogGridRowClassName()).toBe('auto-fit-grid grid-container grid');
    });

    it('merges custom row classes without dropping shared hooks', () => {
      expect(getCatalogGridRowClassName('gap-4')).toBe('auto-fit-grid grid-container grid gap-4');
    });
  });

  describe('getCatalogGridItemClassName', () => {
    it('keeps the shared catalog item hover classes by default', () => {
      expect(getCatalogGridItemClassName()).toBe(
        'character-card transform transition-transform hover:-translate-y-1'
      );
    });

    it('adds clipping classes when requested', () => {
      expect(getCatalogGridItemClassName({ clip: true })).toBe(
        'character-card transform transition-transform hover:-translate-y-1 overflow-hidden rounded-lg'
      );
    });

    it('merges custom item classes', () => {
      expect(getCatalogGridItemClassName({ className: 'p-2' })).toBe(
        'character-card transform transition-transform hover:-translate-y-1 p-2'
      );
    });
  });

  it('renders CatalogGridItem as the shared catalog card wrapper', () => {
    render(
      <CatalogGridItem clip className='p-2' data-testid='catalog-item'>
        Content
      </CatalogGridItem>
    );

    const item = screen.getByTestId('catalog-item');
    expect(item).toHaveClass(
      'character-card',
      'transform',
      'transition-transform',
      'hover:-translate-y-1',
      'overflow-hidden',
      'rounded-lg',
      'p-2'
    );
    expect(item).toHaveTextContent('Content');
  });
});
