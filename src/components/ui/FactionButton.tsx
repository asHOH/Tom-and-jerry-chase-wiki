import React from 'react';
import Image from 'next/image';
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
}

export function FactionButton({
  emoji,
  imageSrc,
  imageAlt,
  title,
  description,
  onClick,
  ariaLabel,
  className = '',
}: FactionButtonProps) {
  const baseStyle = createStyleFromTokens(componentTokens.factionButton.base);
  const contentStyle = createStyleFromTokens(componentTokens.factionButton.content);
  const emojiStyle = createStyleFromTokens(componentTokens.factionButton.emoji);
  const titleStyle = createStyleFromTokens(componentTokens.factionButton.title);
  const descriptionStyle = createStyleFromTokens(componentTokens.factionButton.description);

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`faction-button ${className}`}
      style={baseStyle}
    >
      <div style={contentStyle}>
        {imageSrc ? (
          <div style={emojiStyle}>
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              width={64}
              height={48}
              className='object-contain'
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
