import { cn } from '@/lib/design';
import Link from '@/components/Link';

const variantClasses = {
  portrait: 'flex flex-col items-center overflow-hidden p-0',
  catalog: 'relative overflow-hidden p-0',
  detail: 'h-full overflow-hidden',
} as const;

type EntityCardFrameProps = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'portrait' | 'catalog' | 'detail';
  interactive?: boolean;
  preserveEditParam?: boolean;
  // Accessibility props
  role?: string;
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  'aria-label'?: string;
  href?: string;
};

export default function EntityCardFrame({
  children,
  onClick,
  className = '',
  variant = 'portrait',
  interactive,
  preserveEditParam = false,
  role,
  tabIndex,
  onKeyDown,
  href,
  'aria-label': ariaLabel,
}: EntityCardFrameProps) {
  const isClickable = !!onClick || !!href;
  const isInteractive = interactive ?? isClickable;

  const cardProps = href
    ? {}
    : isClickable
      ? {
          onClick,
          onKeyDown,
          role,
          tabIndex,
          'aria-label': ariaLabel,
        }
      : {
          'aria-label': ariaLabel,
        };

  const content = (
    <div
      className={cn(
        'border-border bg-surface text-foreground group flex-1 rounded-lg border [&_img]:select-none',
        variantClasses[variant],
        isInteractive &&
          'cursor-pointer shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-blue-300 hover:shadow-md dark:hover:border-blue-500',
        className
      )}
      {...cardProps}
    >
      {children}
    </div>
  );

  return href ? (
    <Link
      aria-label={ariaLabel}
      className='flex'
      href={href}
      {...(onClick ? { onClick: () => onClick() } : {})}
      preserveEditParam={preserveEditParam}
    >
      {content}
    </Link>
  ) : (
    content
  );
}
