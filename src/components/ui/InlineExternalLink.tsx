import type { ReactNode } from 'react';

interface InlineExternalLinkProps {
  href: string;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

const baseLinkClasses =
  'rounded-[2px] text-blue-600 underline hover:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none dark:text-blue-400 dark:hover:text-blue-300';

export const InlineExternalLink = ({
  href,
  ariaLabel,
  children,
  className,
}: InlineExternalLinkProps) => {
  return (
    <a
      href={href}
      target='_blank'
      rel='nofollow noopener noreferrer'
      aria-label={ariaLabel}
      className={className ? `${baseLinkClasses} ${className}` : baseLinkClasses}
    >
      {children}
    </a>
  );
};
