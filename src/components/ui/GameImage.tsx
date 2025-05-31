import Image from 'next/image';
import { UI_CONSTANTS } from '@/constants';

type ImageSize = keyof typeof UI_CONSTANTS.IMAGE_SIZES;

type GameImageProps = {
  src: string;
  alt: string;
  size: ImageSize;
  className?: string;
};

export default function GameImage({ src, alt, size, className = '' }: GameImageProps) {
  const { width, height } = UI_CONSTANTS.IMAGE_SIZES[size];
  
  // Use CARD height for details view, IMAGE height for others
  const containerHeight = size === 'CARD_DETAILS' ? UI_CONSTANTS.CONTAINER_HEIGHTS.CARD : UI_CONSTANTS.CONTAINER_HEIGHTS.IMAGE;
  
  return (
    <div className={`w-full ${containerHeight} bg-gray-200 ${UI_CONSTANTS.RADIUS.CARD_TOP} relative overflow-hidden mb-4`}>
      <div className="flex items-center justify-center h-full">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
          className={`${UI_CONSTANTS.TRANSITIONS.SMOOTH} ${className}`}
        />
      </div>
    </div>
  );
}
