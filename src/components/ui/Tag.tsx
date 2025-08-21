import { componentTokens, createStyleFromTokens, designTokens } from '@/lib/design-tokens';
import { useMemo } from 'react';

type TagProps = {
  children: React.ReactNode;
  colorStyles: React.CSSProperties; // New design token approach
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'compact';
  role?: string; // Accessibility
  className?: string;
};

export default function Tag({
  children,
  colorStyles,
  size = 'md',
  variant = 'default',
  role,
  className,
}: TagProps) {
  const baseTagStyle = createStyleFromTokens(
    variant === 'compact' ? componentTokens.tag.compact : componentTokens.tag.base
  );

  // Size-based font sizing
  const fontSize = size === 'xs' ? '0.75rem' : size === 'sm' ? '0.875rem' : '1rem';

  // Memoize the set of positioning tag colors for efficient lookups
  const positioningTagColors = useMemo(() => {
    const colors = new Set<string>();
    for (const tag of Object.values(designTokens.colors.positioningTags)) {
      colors.add(tag.text);
      if (tag.dark) {
        colors.add(tag.dark.text);
      }
    }
    return colors;
  }, []);

  // Detect positioning tags by checking if the current color exists in the generated set
  const isPositioningTag =
    colorStyles.color && positioningTagColors.has(colorStyles.color as string);

  const tagStyle: React.CSSProperties = {
    ...baseTagStyle,
    fontSize,
    ...colorStyles,
    // Remove borders from all positioning tags and compensate with extra padding
    ...(isPositioningTag
      ? {
          border: 'none',
          padding:
            variant === 'compact'
              ? '5px 7px' // +1px each side from original 4px 6px
              : '6px 8px',
        }
      : {
          borderColor: colorStyles.backgroundColor
            ? `${colorStyles.backgroundColor}66`
            : 'transparent',
        }),
  };

  return (
    <span style={tagStyle} {...(role ? { role } : {})} className={className}>
      {children}
    </span>
  );
}
