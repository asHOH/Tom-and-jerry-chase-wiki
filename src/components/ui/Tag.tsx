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

    // Detect positioning tags by checking for positioning tag colors
    const isPositioningTag =
      colorStyles.color &&
      (colorStyles.color === '#dc2626' || // attack red
        colorStyles.color === '#2563eb' || // defense/support blue
        colorStyles.color === '#9a3412' || // chase/wallBreak orange-brown
        colorStyles.color === '#16a34a' || // speedrun green
        colorStyles.color === '#9333ea' || // fight purple
        colorStyles.color === '#4338ca' || // lateGame indigo
        colorStyles.color === '#ca8a04' || // comeback yellow
        colorStyles.color === '#d97706' || // cheese amber
        colorStyles.color === '#059669' || // rescue emerald
        colorStyles.color === '#7c3aed' || // breakthrough violet
        colorStyles.color === '#0d9488' || // lateGameMouse teal
        colorStyles.color === '#4b5563'); // minor gray

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
      <span style={tagStyle} {...(role ? { role } : {})}>
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
      {...(role ? { role } : {})}
    >
      {children}
    </span>
  );
}
