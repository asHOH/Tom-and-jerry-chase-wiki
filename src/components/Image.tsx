import React from 'react';
import type { ImageProps } from 'next/image';

// The component's props are the same as the standard next/image component

const Image: React.FC<ImageProps> = ({ src, alt, priority, fill, ...rest }) => {
  void priority;
  if (typeof src !== 'string') {
    return null;
  }

  const pathWithoutExt = src.substring(0, src.lastIndexOf('.'));

  // Apply styles for fill behavior if fill prop is true
  const fillStyles: React.CSSProperties = fill
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }
    : {};

  return (
    <picture>
      <source srcSet={`${pathWithoutExt}.avif`} type='image/avif' />
      <source srcSet={`${pathWithoutExt}.webp`} type='image/webp' />
      <img src={src} alt={alt} style={fillStyles} {...rest} />
    </picture>
  );
};

export default Image;
