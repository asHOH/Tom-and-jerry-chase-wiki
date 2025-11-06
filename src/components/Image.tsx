import { forwardRef } from 'react';
import NextImage, { ImageProps, ImageLoaderProps } from 'next/image';

const customImageLoader = ({ src }: ImageLoaderProps) => {
  // The `src` here will be the path relative to your `public` directory, e.g., "/images/cats/tom.png"
  // &w=${width}&q=${quality || 75}
  return `/api/image/?src=${encodeURIComponent(src)}&t=${process.env.NODE_ENV == 'development' ? '' : process.env.NEXT_PUBLIC_BUILD_TIMESTAMP}`;
};

const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  return <NextImage loader={customImageLoader} ref={ref} {...props} />;
});

Image.displayName = 'Image';

export default Image;
