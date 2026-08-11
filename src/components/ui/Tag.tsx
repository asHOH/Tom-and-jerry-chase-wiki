import { cn } from '@/lib/design';

type TagProps = {
  children: React.ReactNode;
  colorStyles: React.CSSProperties; // New design token approach
  size?: 'xxs' | 'xs' | 'sm' | 'md';
  margin?: 'default' | 'compact' | 'micro';
  role?: string; // Accessibility
  className?: string;
};

const densityClasses: Record<NonNullable<TagProps['margin']>, string> = {
  default: 'px-2 py-1.5',
  compact: 'px-1.75 py-1.25',
  micro: 'px-1 py-0.75',
};

const fontSizeClasses: Record<NonNullable<TagProps['size']>, string> = {
  xxs: 'text-[0.625rem]',
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
};

export default function Tag({
  children,
  colorStyles,
  size = 'md',
  margin: variant = 'default',
  role,
  className,
}: TagProps) {
  return (
    <span
      style={colorStyles}
      {...(role ? { role } : {})}
      className={cn(
        'inline-block rounded-md border-0 font-medium',
        densityClasses[variant],
        fontSizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
