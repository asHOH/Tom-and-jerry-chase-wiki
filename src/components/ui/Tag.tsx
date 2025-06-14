import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

type TagProps = {
  children: React.ReactNode;
  colorClasses?: string; // Legacy support - deprecated
  colorStyles?: React.CSSProperties; // New design token approach
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'compact';
  role?: string; // Accessibility
};

export default function Tag({
  children,
  colorClasses,
  colorStyles,
  size = 'md',
  variant = 'default',
  role,
}: TagProps) {
  // Issue deprecation warning for colorClasses (only in development)
  if (colorClasses && !colorStyles && process.env.NODE_ENV === 'development') {
    console.warn(
      'Tag: colorClasses prop is deprecated. Use colorStyles from design tokens instead.'
    );
  }

  const baseTagStyle = createStyleFromTokens(
    variant === 'compact' ? componentTokens.tag.compact : componentTokens.tag.base
  );

  // Use new colorStyles if provided, otherwise fall back to legacy colorClasses
  if (colorStyles) {
    // Size-based font sizing
    const fontSize = size === 'xs' ? '0.75rem' : size === 'sm' ? '0.875rem' : '1rem';

    const tagStyle: React.CSSProperties = {
      ...baseTagStyle,
      fontSize,
      ...colorStyles,
      // Add subtle border using the background color with reduced opacity for better definition
      borderColor: colorStyles.backgroundColor ? `${colorStyles.backgroundColor}66` : 'transparent',
    };

    return (
      <span style={tagStyle} role={role}>
        {children}
      </span>
    );
  }

  // Legacy fallback - will be removed in future version
  const legacyPadding = variant === 'compact' ? 'px-1.5 py-1' : 'px-2 py-1';
  const legacyRadius = variant === 'compact' ? 'rounded' : 'rounded-md';

  return (
    <span
      className={`${legacyPadding} ${legacyRadius} text-sm font-medium border ${colorClasses}`}
      role={role}
    >
      {children}
    </span>
  );
}
