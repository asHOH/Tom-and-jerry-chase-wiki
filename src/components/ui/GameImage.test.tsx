import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import GameImage from './GameImage';
import type { GameImageSize } from './gameImageDimensions';

type MockImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  placeholder?: string;
  preload?: boolean;
};

const mockImage = jest.fn();

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: function MockImage({
    placeholder: _placeholder,
    preload: _preload,
    ...props
  }: MockImageProps) {
    mockImage(props);
    return React.createElement('img', props);
  },
}));

describe('GameImage', () => {
  beforeEach(() => {
    mockImage.mockClear();
  });

  it.each([
    ['CHARACTER_CARD', 140, 140, '210px', 'h-48'],
    ['KNOWLEDGECARD_CARD', 140, 140, '160px', 'h-48'],
    ['SPECIAL_SKILL_CARD', 90, 90, '90px', 'h-48'],
    ['ITEM_CARD', 130, 130, '130px', 'h-48'],
    ['CARD_DETAILS', 220, 220, '(max-width: 768px) 200px, 320px', 'h-64'],
  ] satisfies ReadonlyArray<readonly [GameImageSize, number, number, string, string]>)(
    'preserves the %s intrinsic dimensions and container height',
    (size, width, height, sizes, containerHeightClass) => {
      render(<GameImage src='/images/items/test.png' alt={`${size} image`} size={size} />);

      const image = screen.getByRole('img', { name: `${size} image` });
      const container = image.parentElement?.parentElement;

      expect(image).toHaveAttribute('width', String(width));
      expect(image).toHaveAttribute('height', String(height));
      expect(image).toHaveAttribute('sizes', sizes);
      expect(container).toHaveClass(containerHeightClass);
    }
  );

  it('allows a caller-provided container height to override the default', () => {
    render(
      <GameImage
        src='/images/items/test.png'
        alt='Custom-height image'
        size='ITEM_CARD'
        style={{ height: '6rem' }}
      />
    );

    const image = screen.getByRole('img', { name: 'Custom-height image' });

    expect(image.parentElement?.parentElement).toHaveClass('h-48');
    expect(image.parentElement?.parentElement).toHaveStyle({ height: '6rem' });
  });

  it('reveals the image after loading and forwards the load callback', () => {
    const onLoad = jest.fn();

    render(
      <GameImage
        src='/images/items/test.png'
        alt='Loading image'
        size='ITEM_CARD'
        onLoad={onLoad}
      />
    );

    const image = screen.getByRole('img', { name: 'Loading image' });

    expect(image).toHaveClass('transition-all', 'duration-250', 'ease-in-out');
    expect(image).toHaveStyle({ opacity: '0' });

    fireEvent.load(image);

    expect(image).toHaveStyle({ opacity: '1' });
    expect(onLoad).toHaveBeenCalledTimes(1);
  });
});
