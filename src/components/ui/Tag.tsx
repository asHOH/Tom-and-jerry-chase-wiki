import { componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

type TagProps = {
  children: React.ReactNode;
  colorStyles: React.CSSProperties; // New design token approach
  size?: 'xxs' | 'xs' | 'sm' | 'md';
  margin?: 'default' | 'compact' | 'micro';
  role?: string; // Accessibility
  className?: string;
};

export default function Tag({
  children,
  colorStyles,
  size = 'md',
  margin: variant = 'default',
  role,
  className,
}: TagProps) {
  const baseTagStyle = createStyleFromTokens(
    variant === 'micro'
      ? componentTokens.tag.micro
      : variant === 'compact'
        ? componentTokens.tag.compact
        : componentTokens.tag.base
  );

  // Size-based font sizing
  const fontSize =
    size === 'xxs' ? '0.625rem' : size === 'xs' ? '0.75rem' : size === 'sm' ? '0.875rem' : '1rem';

  const tagStyle: React.CSSProperties = {
    ...baseTagStyle,
    fontSize,
    ...colorStyles,
  };

  return (
    <span style={tagStyle} {...(role ? { role } : {})} className={className}>
      {children}
    </span>
  );
}
