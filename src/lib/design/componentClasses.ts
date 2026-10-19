import { cn } from './cn';

const navButtonThemes = {
  active: 'bg-action-primary text-action-primary-foreground',
  inactive: 'bg-control text-gray-800 hover:bg-control-hover dark:text-gray-200',
  navigating: 'bg-gray-400 text-white cursor-not-allowed opacity-80 pointer-events-none',
};

const actionButtonVariants = {
  primary:
    'bg-action-primary text-action-primary-foreground shadow-sm hover:bg-action-primary-hover',
  secondary:
    'bg-control text-gray-800 hover:bg-control-hover border border-gray-200 dark:text-gray-100 dark:border-slate-600',
  ghost: 'text-gray-700 hover:bg-control dark:text-gray-200',
  danger: 'bg-action-danger text-action-danger-foreground shadow-sm hover:bg-action-danger-hover',
  success:
    'bg-action-success text-action-success-foreground shadow-sm hover:bg-action-success-hover',
  warning:
    'bg-action-warning text-action-warning-foreground shadow-sm hover:bg-action-warning-hover',
};

const actionButtonSizes = {
  sm: 'text-sm px-3 py-2 rounded-md',
  md: 'text-base px-4 py-2.5 rounded-lg',
  lg: 'text-lg px-5 py-3 rounded-lg',
};

export type FilterButtonTone = 'default' | 'blue' | 'green' | 'strongNeutral';

const filterButtonActiveToneClasses: Record<FilterButtonTone, string> = {
  default: 'bg-control text-gray-900 hover:bg-control-hover dark:text-gray-100',
  blue: 'bg-action-primary text-action-primary-foreground hover:bg-action-primary-hover',
  green:
    'bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700',
  strongNeutral:
    'border-control-active bg-control-active hover:bg-control-active-hover border text-gray-800 dark:text-gray-100',
};

const formControlSizes = {
  sm: 'px-2 py-2 text-sm rounded-lg',
  md: 'px-3 py-3 text-lg rounded-lg',
};

const formControlStateClasses = {
  default: 'border-gray-300 focus:border-transparent focus:ring-focus dark:border-gray-600',
  invalid: 'border-validation-error focus:border-transparent focus:ring-validation-error',
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
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  let state = navButtonThemes.inactive;
  if (isNavigating) {
    state = navButtonThemes.navigating;
  } else if (isActive) {
    state = suppressActiveBackground ? 'text-action-primary-foreground' : navButtonThemes.active;
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
    'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';
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

export function getSelectionControlClasses(selected: boolean): string {
  return cn(
    'border transition-colors',
    selected
      ? 'border-focus bg-action-primary-subtle text-action-primary-subtle-foreground hover:bg-action-primary-subtle-hover'
      : 'border-border bg-surface text-muted-foreground hover:bg-control'
  );
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
    'bg-surface-sunken border text-gray-900 placeholder-gray-500 transition-all duration-200 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70 dark:text-gray-100 dark:placeholder-gray-400',
    width,
    formControlSizes[size],
    state,
    options?.className
  );
}
