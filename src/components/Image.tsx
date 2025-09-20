import NextImage, { ImageProps, ImageLoaderProps } from 'next/image';

const customImageLoader = ({ src }: ImageLoaderProps) => {
  // The `src` here will be the path relative to your `public` directory, e.g., "/images/cats/tom.png"
  // &w=${width}&q=${quality || 75}
  return `/api/image/?src=${encodeURIComponent(src)}&t=${process.env.NODE_ENV == 'development' ? '' : process.env.NEXT_PUBLIC_BUILD_TIMESTAMP}`;
};

const Image = (props: ImageProps) => {
  return <NextImage loader={customImageLoader} {...props} />;
};

void Image;

export default NextImage;
