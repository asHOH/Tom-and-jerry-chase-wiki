import { ReactNode } from 'react';

import { designTokens } from '@/lib/design-tokens';

type NavigationButtonsRowProps = {
  children: ReactNode;
  className?: string;
};

export default function NavigationButtonsRow({ children, className }: NavigationButtonsRowProps) {
  const spacing = designTokens.spacing;

  return (
    <div
      className={[
        'flex flex-wrap items-center border-t border-gray-300 text-sm dark:border-gray-600',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        gap: spacing.sm,
        marginLeft: spacing.md,
        marginRight: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.md,
      }}
    >
      {children}
    </div>
  );
}
