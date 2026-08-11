import { CSSProperties, useState } from 'react';

import { cn } from '@/lib/design';
import Image from '@/components/Image';

import { GAME_IMAGE_DIMENSIONS, type GameImageSize } from './gameImageDimensions';

type GameImageProps = {
  src: string;
  alt: string;
  size: GameImageSize;
  className?: string;
  preload?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: CSSProperties; //replace default style
};

export default function GameImage({
  src,
  alt,
  size,
  className = '',
  preload = false,
  sizes,
  onLoad,
  onError,
  style,
}: GameImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { width, height } = GAME_IMAGE_DIMENSIONS[size];

  // Detect if this is a cat character image for larger display
  const isCatCharacter = src.includes('/images/cats/');
  const maxHeight = isCatCharacter ? '100%' : '85%';

  // Optimize sizes attribute based on image size and usage
  const optimizedSizes =
    sizes ||
    (() => {
      switch (size) {
        case 'CARD_DETAILS':
          return '(max-width: 768px) 200px, 320px';
        case 'CHARACTER_CARD':
          return '210px';
        case 'KNOWLEDGECARD_CARD':
          return '160px';
        case 'SPECIAL_SKILL_CARD':
          return '90px';
        case 'ITEM_CARD':
          return '130px';
        default:
          return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
      }
    })();

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div
      className={cn(
        'relative mb-3 w-full overflow-hidden bg-gray-200 dark:bg-slate-700',
        size === 'CARD_DETAILS' ? 'h-64' : 'h-48'
      )}
      style={style}
    >
      <div className='flex h-full items-center justify-center p-2'>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          preload={preload}
          placeholder='empty'
          sizes={optimizedSizes}
          loading={preload ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={onError}
          style={{
            objectFit: 'contain',
            maxHeight,
            maxWidth: '100%',
            height: 'auto',
            opacity: isLoaded ? 1 : 0,
          }}
          className={cn('transition-all duration-250 ease-in-out', className)}
        />
      </div>
    </div>
  );
}
