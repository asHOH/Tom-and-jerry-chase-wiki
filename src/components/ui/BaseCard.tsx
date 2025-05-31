import { UI_CONSTANTS } from '@/constants';

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
  
  const variantClasses = {
    character: `card flex flex-col items-center ${UI_CONSTANTS.TRANSITIONS.HOVER_SCALE} cursor-pointer character-card-container p-0 overflow-hidden`,
    item: `bg-white ${UI_CONSTANTS.RADIUS.CARD} cursor-pointer ${UI_CONSTANTS.TRANSITIONS.CARD_HOVER} relative overflow-hidden p-0`,
    details: `card h-full`
  };
  
  const baseClasses = variantClasses[variant];
  const finalClasses = `${baseClasses} ${className}`;
  
  const cardProps = isClickable ? {
    onClick,
    style: variant === 'character' ? { transform: 'translateZ(0)' } : undefined
  } : {};
  
  return (
    <div className={finalClasses} {...cardProps}>
      {children}
    </div>
  );
}
