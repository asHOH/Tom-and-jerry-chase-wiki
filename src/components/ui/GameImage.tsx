import { CSSProperties, useState } from 'react';

import { componentTokens, designTokens } from '@/lib/design-tokens';
import Image from '@/components/Image';

type ImageSize = keyof typeof componentTokens.image.dimensions;

type GameImageProps = {
  src: string;
  alt: string;
  size: ImageSize;
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
  const { width, height } = componentTokens.image.dimensions[size];

  // Use card height for details view, image height for others
  const containerHeight =
    size === 'CARD_DETAILS'
      ? componentTokens.card.content.height
      : componentTokens.image.container.height;

  // Detect if this is a cat character image for larger display
  const isCatCharacter = src.includes('/images/cats/');
  const maxHeight = isCatCharacter ? '90%' : '80%';

  // Optimize sizes attribute based on image size and usage
  const optimizedSizes =
    sizes ||
    (() => {
      switch (size) {
        case 'CARD_DETAILS':
          return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
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
      className='relative mb-3 w-full overflow-hidden bg-gray-200 dark:bg-slate-700'
      style={{
        ...{
          height: containerHeight,
          borderRadius: componentTokens.image.container.borderRadius,
        },
        ...style,
      }}
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
            transition: designTokens.transitions.normal,
            opacity: isLoaded ? 1 : 0,
          }}
          className={className}
        />
      </div>
    </div>
  );
}
