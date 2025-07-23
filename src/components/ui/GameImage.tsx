import Image from 'next/image';
import { useState } from 'react';
import { componentTokens } from '@/lib/design-tokens';

type ImageSize = keyof typeof componentTokens.image.dimensions;

type GameImageProps = {
  src: string;
  alt: string;
  size: ImageSize;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
};

export default function GameImage({
  src,
  alt,
  size,
  className = '',
  priority = false,
  sizes,
  onLoad,
  onError,
}: GameImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
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
          return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
        case 'CARD_ITEM':
          return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
        default:
          return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
      }
    })();

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div
      className='w-full bg-gray-200 dark:bg-slate-700 relative overflow-hidden mb-4'
      style={{
        height: containerHeight,
        borderRadius: componentTokens.image.container.borderRadius,
      }}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='animate-pulse bg-gray-300 dark:bg-slate-600 rounded w-16 h-16'></div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className='absolute inset-0 flex items-center justify-center text-gray-400 dark:text-slate-500'>
          <div className='text-center'>
            <div className='text-2xl mb-1'>📷</div>
            <div className='text-xs'>加载失败</div>
          </div>
        </div>
      )}

      <div className='flex items-center justify-center h-full p-2'>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder='empty'
          sizes={optimizedSizes}
          loading='eager' // Load all images eagerly for better UX
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            objectFit: 'contain',
            maxHeight: maxHeight,
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            transition: 'opacity 0.3s ease-in-out',
            opacity: isLoaded ? 1 : 0, // Smooth fade-in when loaded
          }}
          className={className}
        />
      </div>
    </div>
  );
}
