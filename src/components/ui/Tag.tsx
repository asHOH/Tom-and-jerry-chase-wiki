import { UI_CONSTANTS } from '@/constants';

type TagProps = {
  children: React.ReactNode;
  colorClasses: string;
  size?: 'sm' | 'md';
};

export default function Tag({ children, colorClasses, size = 'md' }: TagProps) {
  const sizeClasses = size === 'sm' ? 'text-xs' : 'text-sm';
  
  return (
    <span
      className={`${UI_CONSTANTS.SPACING.TAG_PADDING} ${UI_CONSTANTS.RADIUS.TAG} ${sizeClasses} font-medium ${colorClasses}`}
    >
      {children}
    </span>
  );
}
