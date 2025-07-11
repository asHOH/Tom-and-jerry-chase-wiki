import React from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

export interface FactionButtonProps {
  emoji?: string;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  onClick: () => void;
  ariaLabel: string;
  className?: string;

  priority?: boolean;
}

export function FactionButton({
  emoji,
  imageSrc,
  imageAlt,
  title,
  description,
  onClick,
  ariaLabel,
  className,

  priority = false,
}: FactionButtonProps) {
  const baseStyle = createStyleFromTokens(componentTokens.factionButton.base);
  const contentStyle = createStyleFromTokens(componentTokens.factionButton.content);
  const emojiStyle = createStyleFromTokens(componentTokens.factionButton.emoji);
  const titleStyle = createStyleFromTokens(componentTokens.factionButton.title);
  const descriptionStyle = createStyleFromTokens(componentTokens.factionButton.description);

  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={ariaLabel}
      className={clsx(
        'faction-button',
        'sm:px-6',
        'sm:py-4',
        'px-4',
        'py-3',
        'dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-600',
        className
      )}
      style={{ ...baseStyle, padding: undefined }}
    >
      <div style={contentStyle}>
        {imageSrc ? (
          <div style={emojiStyle}>
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              width={64}
              height={64}
              style={{ height: '40px', width: 'auto' }}
              className='object-contain flex-shrink-0'
              priority={priority}
            />
          </div>
        ) : (
          <span style={emojiStyle}>{emoji}</span>
        )}
        <span style={titleStyle}>{title}</span>
      </div>
      <div style={descriptionStyle}>{description}</div>
    </button>
  );
}

export default React.memo(FactionButton);
