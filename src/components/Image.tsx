import { forwardRef } from 'react';
import NextImage, { ImageProps, ImageLoaderProps } from 'next/image';

const customImageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  const params = new URLSearchParams();
  params.set('src', src);
  if (typeof width === 'number') {
    params.set('w', String(width));
  }
  if (typeof quality === 'number') {
    params.set('q', String(quality));
  }
  if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_BUILD_TIMESTAMP) {
    params.set('t', process.env.NEXT_PUBLIC_BUILD_TIMESTAMP);
  }

  return `/api/image?${params.toString()}`;
};

const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  return <NextImage loader={customImageLoader} ref={ref} {...props} />;
});

Image.displayName = 'Image';

export default Image;
