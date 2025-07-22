import Image from 'next/image';
import { designTokens, componentTokens } from '@/lib/design-tokens';

type ImageSize = keyof typeof componentTokens.image.dimensions;

type GameImageProps = {
  src: string;
  alt: string;
  size: ImageSize;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
};

// Generate a simple blur placeholder for better loading experience
const generateBlurDataURL = (width: number, height: number): string => {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <rect width="60%" height="60%" x="20%" y="20%" fill="#e5e7eb" rx="8"/>
    </svg>`
  ).toString('base64')}`;
};

export default function GameImage({
  src,
  alt,
  size,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  onLoad,
  onError,
}: GameImageProps) {
  const { width, height } = componentTokens.image.dimensions[size];

  // Use card height for details view, image height for others
  const containerHeight =
    size === 'CARD_DETAILS'
      ? componentTokens.card.content.height
      : componentTokens.image.container.height;

  // Detect if this is a cat character image for larger display
  const isCatCharacter = src.includes('/images/cats/');
  const maxHeight = isCatCharacter ? '90%' : '80%';

  // Generate default blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width, height);

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

  return (
    <div
      className='w-full bg-gray-200 dark:bg-slate-700 relative overflow-hidden mb-4'
      style={{
        height: containerHeight,
        borderRadius: componentTokens.image.container.borderRadius,
      }}
    >
      <div className='flex items-center justify-center h-full p-2'>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={defaultBlurDataURL}
          sizes={optimizedSizes}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={onLoad}
          onError={onError}
          style={{
            objectFit: 'contain',
            maxHeight: maxHeight,
            maxWidth: '100%',
            width: 'auto',
            height: 'auto',
            transition: designTokens.transitions.normal,
          }}
          className={className}
        />
      </div>
    </div>
  );
}
