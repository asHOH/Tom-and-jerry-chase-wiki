import { designTokens, componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

type TagProps = {
  children: React.ReactNode;
  colorClasses?: string; // Legacy support - deprecated
  colorStyles?: React.CSSProperties; // New design token approach
  size?: 'sm' | 'md';
};

export default function Tag({ children, colorClasses, colorStyles, size = 'md' }: TagProps) {
  // Issue deprecation warning for colorClasses
  if (colorClasses && !colorStyles) {
    console.warn('Tag: colorClasses prop is deprecated. Use colorStyles from design tokens instead.');
  }
  
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';
  const baseTagStyle = createStyleFromTokens(componentTokens.tag.base);
  
  // Use new colorStyles if provided, otherwise fall back to legacy colorClasses
  if (colorStyles) {
    const tagStyle = {
      ...baseTagStyle,
      fontSize: size === 'sm' ? designTokens.typography.fontSize.xs : designTokens.typography.fontSize.sm,
      ...colorStyles
    };
    
    return (
      <span style={tagStyle}>
        {children}
      </span>
    );
  }
  
  // Legacy fallback - will be removed in future version
  return (
    <span
      className={`px-2 py-1 rounded text-sm font-medium ${colorClasses}`}
    >
      {children}
    </span>
  );
}
