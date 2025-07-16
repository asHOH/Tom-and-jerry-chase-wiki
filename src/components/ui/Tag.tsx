import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

type TagProps = {
  children: React.ReactNode;
  colorStyles: React.CSSProperties; // New design token approach
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'compact';
  role?: string; // Accessibility
};

export default function Tag({
  children,
  colorStyles,
  size = 'md',
  variant = 'default',
  role,
}: TagProps) {
  const baseTagStyle = createStyleFromTokens(
    variant === 'compact' ? componentTokens.tag.compact : componentTokens.tag.base
  );

  // Size-based font sizing
  const fontSize = size === 'xs' ? '0.75rem' : size === 'sm' ? '0.875rem' : '1rem';

  // Detect positioning tags by checking for positioning tag colors, including dark mode variants
  const isPositioningTag =
    colorStyles.color &&
    [
      // Light mode colors
      '#dc2626', // attack red
      '#2563eb', // defense/support blue
      '#9a3412', // chase/wallBreak orange-brown
      '#16a34a', // speedrun green
      '#9333ea', // fight purple
      '#4338ca', // lateGame indigo
      '#d97706', // comeback/cheese amber
      '#059669', // rescue emerald
      '#0d9488', // lateGameMouse teal
      '#4b5563', // minor gray
      // Dark mode colors
      '#f87171', // attack red
      '#60a5fa', // defense/support blue
      '#fdbf74', // chase/wallBreak orange
      '#86efac', // speedrun green
      '#c4b5fd', // fight/breakthrough purple
      '#a5b4fc', // lateGame indigo
      '#fcd34d', // comeback/cheese amber
      '#34d399', // rescue emerald
      '#5eead4', // lateGameMouse teal
      '#9ca3af', // minor gray
    ].includes(colorStyles.color as string);

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
