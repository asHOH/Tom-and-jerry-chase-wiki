import { designTokens, componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

type TagProps = {
  children: React.ReactNode;
  colorClasses?: string; // Legacy support - deprecated
  colorStyles?: React.CSSProperties; // New design token approach
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'compact';
};

export default function Tag({ children, colorClasses, colorStyles, size = 'md', variant = 'default' }: TagProps) {
  // Issue deprecation warning for colorClasses
  if (colorClasses && !colorStyles) {
    console.warn('Tag: colorClasses prop is deprecated. Use colorStyles from design tokens instead.');
  }
  
  const sizeClasses = size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-xs' : 'text-sm';
  const baseTagStyle = createStyleFromTokens(
    variant === 'compact' ? componentTokens.tag.compact : componentTokens.tag.base
  );
  
  // Use new colorStyles if provided, otherwise fall back to legacy colorClasses
  if (colorStyles) {
    const fontSize = size === 'xs' ? designTokens.typography.fontSize.xs : 
                    size === 'sm' ? designTokens.typography.fontSize.xs : 
                    designTokens.typography.fontSize.sm;
    
    const tagStyle = {
      ...baseTagStyle,
      fontSize,
      ...colorStyles,
      // Add subtle border using the background color with reduced opacity for better definition
      borderColor: colorStyles.backgroundColor ? `${colorStyles.backgroundColor}66` : 'transparent'
    };
    
    return (
      <span style={tagStyle}>
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
    >
      {children}
    </span>
  );
}
