export const disclosureToneClasses = {
  default: 'border-border bg-control',
  red: 'border-red-300 bg-red-200 dark:border-red-700 dark:bg-red-900',
  orange: 'border-orange-300 bg-orange-200 dark:border-orange-700 dark:bg-orange-900',
  yellow: 'border-yellow-300 bg-yellow-200 dark:border-yellow-700 dark:bg-yellow-900',
  green: 'border-green-400 bg-green-200 dark:border-green-700 dark:bg-green-900',
  blue: 'border-blue-400 bg-blue-200 dark:border-blue-700 dark:bg-blue-900',
  purple: 'border-fuchsia-300 bg-fuchsia-200 dark:border-fuchsia-700 dark:bg-fuchsia-900',
  lime: 'border-lime-200 bg-lime-100 dark:border-lime-700 dark:bg-lime-900',
} as const;

export type DisclosureTone = keyof typeof disclosureToneClasses;

export const disclosureTitleSizeClasses = {
  xs: 'text-sm',
  sm: 'text-xl',
  md: 'text-2xl',
} as const;

export type DisclosureSize = keyof typeof disclosureTitleSizeClasses;

export const disclosureTriggerFocusClasses =
  'focus-visible:ring-focus focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none';
