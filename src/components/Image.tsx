import { forwardRef } from 'react';
import NextImage, { ImageProps } from 'next/image';

const Image =
  !process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION && process.env.NODE_ENV !== 'development'
    ? forwardRef<HTMLImageElement, ImageProps>(function Image(props, ref) {
        const { src, ...rest } = props;

        // If src is not a string (e.g. imported image object) or is external, use default NextImage
        if (typeof src !== 'string' || src.startsWith('http') || src.startsWith('//')) {
          return <NextImage ref={ref} src={src} {...rest} />;
        }

        // For local images, use picture tag with AVIF/WebP sources
        // We assume the build script has generated .avif and .webp versions
        const lastDotIndex = src.lastIndexOf('.');
        const srcWithoutExt = lastDotIndex !== -1 ? src.substring(0, lastDotIndex) : src;

        return (
          <picture>
            <source srcSet={`${srcWithoutExt}.avif`} type='image/avif' />
            <source srcSet={`${srcWithoutExt}.webp`} type='image/webp' />
            <NextImage ref={ref} src={src} unoptimized {...rest} />
          </picture>
        );
      })
    : forwardRef<HTMLImageElement, ImageProps>(function Image(props, ref) {
        return <NextImage ref={ref} unoptimized {...props} />;
      });

export default Image;
