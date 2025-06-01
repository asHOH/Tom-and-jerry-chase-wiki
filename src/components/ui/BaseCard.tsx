import { designTokens, componentTokens, createStyleFromTokens } from '@/lib/design-tokens';

type BaseCardProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'character' | 'item' | 'details';
};

export default function BaseCard({ 
  children, 
  onClick, 
  className = '', 
  variant = 'character' 
}: BaseCardProps) {
  const isClickable = !!onClick;
  
  const getVariantStyles = () => {
    const baseCardStyle = createStyleFromTokens(componentTokens.card.base);
    
    switch (variant) {      case 'character':
        return {
          ...baseCardStyle,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          padding: 0,
          overflow: 'hidden',
          transition: designTokens.transitions.hover,
          transform: 'translateZ(0)'
        };
      case 'item':
        return {
          ...baseCardStyle,
          backgroundColor: '#ffffff',
          position: 'relative' as const,
          overflow: 'hidden',
          padding: 0
        };
      case 'details':
        return {
          ...baseCardStyle,
          height: '100%'
        };
      default:
        return baseCardStyle;
    }
  };
  
  const cardStyle = getVariantStyles();
  
  const cardProps = isClickable ? {
    onClick,
    style: cardStyle
  } : {
    style: cardStyle
  };
    return (
    <div className={className} {...cardProps}>
      {children}
    </div>
  );
}
