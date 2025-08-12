import NextImage, { ImageProps, ImageLoaderProps } from 'next/image';

const customImageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // The `src` here will be the path relative to your `public` directory, e.g., "/images/cats/tom.png"
  return `/api/image/?src=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
};

const Image = (props: ImageProps) => {
  return <NextImage loader={customImageLoader} {...props} />;
};

export default Image;
