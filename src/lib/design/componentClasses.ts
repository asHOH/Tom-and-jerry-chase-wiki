import { cn } from './cn';

const navButtonThemes = {
  active: 'bg-blue-600 text-white dark:bg-blue-700',
  inactive:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600',
  navigating: 'bg-gray-400 text-white cursor-not-allowed opacity-80 pointer-events-none',
};

const actionButtonVariants = {
  primary:
    'bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
  secondary:
    'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600 dark:border-slate-600',
  ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
  success:
    'bg-green-600 text-white shadow-sm hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600',
  warning:
    'bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500',
};

const actionButtonSizes = {
  sm: 'text-sm px-3 py-2 rounded-md',
  md: 'text-base px-4 py-2.5 rounded-lg',
  lg: 'text-lg px-5 py-3 rounded-lg',
};

export type FilterButtonTone = 'default' | 'blue' | 'green' | 'neutral';

const filterButtonActiveToneClasses: Record<FilterButtonTone, string> = {
  default:
    'bg-gray-200 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-700',
  blue: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700',
  green:
    'bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700',
  neutral:
    'border border-gray-400 bg-gray-400 text-gray-800 hover:bg-gray-500 dark:border-gray-500 dark:bg-gray-500 dark:text-gray-100 dark:hover:bg-gray-400',
};

const formControlSizes = {
  sm: 'px-2 py-2 text-sm rounded-lg',
  md: 'px-3 py-3 text-lg rounded-lg',
};

const formControlStateClasses = {
  default: 'border-gray-300 focus:border-transparent focus:ring-blue-500 dark:border-gray-600',
  invalid: 'border-red-500 focus:border-transparent focus:ring-red-500 dark:border-red-500',
};

/**
 * Generates class names for navigation buttons used in TabNavigation and related header items.
 * Consolidates layout, focus states, and dynamic themes.
 */
export function getNavigationButtonClasses(
  isNavigating: boolean,
  isActive: boolean,
  isSquare: boolean = false,
  suppressActiveBackground: boolean = false
): string {
  const layout = isSquare
    ? 'flex h-10 w-10 items-center justify-center rounded-md border-none p-2 md:h-11 md:w-11 lg:p-2.5 transition-colors'
    : 'flex min-h-10 items-center justify-center whitespace-nowrap rounded-md border-none px-2 py-2 text-sm transition-colors md:min-h-11 md:px-2.5 lg:px-3.5 lg:text-base';
  const focus =
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300';

  let state = navButtonThemes.inactive;
  if (isNavigating) {
    state = navButtonThemes.navigating;
  } else if (isActive) {
    state = suppressActiveBackground ? 'text-white' : navButtonThemes.active;
  }

  return cn('relative z-10', layout, focus, state);
}

export type ActionButtonVariant = keyof typeof actionButtonVariants;
export type ActionButtonSize = keyof typeof actionButtonSizes;

export function getActionButtonClasses(
  variant: ActionButtonVariant = 'primary',
  size: ActionButtonSize = 'md',
  options?: { fullWidth?: boolean; loading?: boolean }
): string {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60';
  return cn(
    base,
    actionButtonVariants[variant],
    actionButtonSizes[size],
    options?.fullWidth && 'w-full',
    options?.loading && 'cursor-progress'
  );
}

export function getFilterButtonActiveToneClasses(tone: FilterButtonTone = 'default'): string {
  return filterButtonActiveToneClasses[tone];
}

export type FormControlSize = keyof typeof formControlSizes;

export function getFormControlClasses(options?: {
  size?: FormControlSize;
  invalid?: boolean;
  fullWidth?: boolean;
  className?: string | undefined;
}): string {
  const size = options?.size ?? 'md';
  const state = options?.invalid
    ? formControlStateClasses.invalid
    : formControlStateClasses.default;
  const width = (options?.fullWidth ?? true) ? 'w-full' : 'w-auto';

  return cn(
    'border bg-white text-gray-900 placeholder-gray-500 transition-all duration-200 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-400',
    width,
    formControlSizes[size],
    state,
    options?.className
  );
}
