import React from 'react';

import ActionTile from '@/components/ui/ActionTile';
import Image from '@/components/Image';

interface FactionButtonProps {
  emoji?: string;
  imageSrc?: string;
  imageAlt?: string;
  title?: string;
  description: string;
  href?: string;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;

  preload?: boolean;
}

function FactionButton({
  emoji,
  imageSrc,
  imageAlt,
  title,
  description,
  href,
  onClick,
  ariaLabel,
  className,
  preload = false,
}: FactionButtonProps) {
  const icon = imageSrc ? (
    <Image
      src={imageSrc}
      alt={imageAlt || title || ''}
      width={36}
      height={36}
      className='h-9 w-auto flex-shrink-0 object-contain md:h-10'
      preload={preload}
    />
  ) : emoji ? (
    <span className='text-xl md:text-2xl'>{emoji}</span>
  ) : null;

  const tileProps = {
    title: title ?? '',
    description,
    icon,
    ariaLabel,
    layout: 'stacked' as const,
    className: `faction-button flex-1 gap-1 px-0 py-3 hover:-translate-y-0.5 hover:shadow-lg md:gap-2${
      className ? ` ${className}` : ''
    }`,
    contentRowClassName: 'gap-2 md:gap-3',
    iconWrapperClassName: 'text-xl md:text-2xl',
    titleClassName: 'text-xl md:text-2xl',
    descriptionClassName: 'mt-0.5 text-xs md:mt-1 md:text-sm',
    ...(href ? { href } : {}),
    ...(onClick ? { onClick } : {}),
  };

  return <ActionTile {...tileProps} />;
}

export default React.memo(FactionButton);
