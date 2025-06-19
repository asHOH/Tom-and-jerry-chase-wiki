import Image from 'next/image';
import { designTokens, componentTokens } from '@/lib/design-tokens';

type ImageSize = keyof typeof componentTokens.image.dimensions;

type GameImageProps = {
  src: string;
  alt: string;
  size: ImageSize;
  className?: string;
};

export default function GameImage({ src, alt, size, className = '' }: GameImageProps) {
  const { width, height } = componentTokens.image.dimensions[size];

  // Use card height for details view, image height for others
  const containerHeight =
    size === 'CARD_DETAILS'
      ? componentTokens.card.content.height
      : componentTokens.image.container.height;

  // Detect if this is a cat character image for larger display
  const isCatCharacter = src.includes('/images/cats/');
  const maxHeight = isCatCharacter ? '90%' : '80%';

  return (
    <div
      className='w-full bg-gray-200 relative overflow-hidden mb-4'
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
          unoptimized
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
