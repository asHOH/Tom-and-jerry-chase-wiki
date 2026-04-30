import React, { ReactNode, useId } from 'react';
import { m, MotionStyle } from 'motion/react';

import { cn } from '@/lib/design';

import FilterLabel from './FilterLabel';

export type FilterRowProps<T extends string | number> = {
  label: string;
  options: readonly T[] | T[];
  isActive: (opt: T) => boolean;
  onToggle: (opt: T) => void;
  // Optional wrappers and styling
  // Provide a custom label for each option; defaults to String(opt)
  getOptionLabel?: ((opt: T, active: boolean) => ReactNode) | undefined;
  renderOption?: ((opt: T, button: ReactNode) => ReactNode) | undefined;
  getButtonClassName?: ((opt: T, active: boolean) => string) | undefined;
  getButtonStyle?: ((opt: T, active: boolean) => React.CSSProperties | undefined) | undefined;
  // Option can be disabled (e.g., interlocks)
  getButtonDisabled?: ((opt: T, active: boolean) => boolean | undefined) | undefined;
  // Container overrides
  className?: string | undefined;
  innerClassName?: string | undefined;
  // Accessibility
  ariaLabel?: string | undefined;
};

export default function FilterRow<T extends string | number>(props: FilterRowProps<T>) {
  const {
    label,
    options,
    isActive,
    onToggle,
    getOptionLabel,
    renderOption,
    getButtonClassName,
    getButtonStyle,
    getButtonDisabled,
    className,
    innerClassName,
    ariaLabel,
  } = props;
  const labelId = useId();

  return (
    <div
      className={cn('mt-1 flex items-center justify-center gap-2 md:mt-4', className)}
      role='group'
      aria-labelledby={labelId}
    >
      <FilterLabel id={labelId} full={label} />
      {/* <div className='w-full md:w-32 text-left'>
        <div className='font-medium'>{label}</div>
      </div> */}
      <div className='flex'>
        <div
          className={cn('flex flex-wrap gap-1 md:gap-2', innerClassName)}
          aria-label={ariaLabel || label}
        >
          {options.map((opt) => {
            const active = isActive(opt as T);
            const provided = getButtonStyle?.(opt as T, active);
            const finalStyle = provided;
            const labelNode = getOptionLabel ? getOptionLabel(opt as T, active) : String(opt);
            const button = (
              <m.button
                key={String(opt)}
                type='button'
                onClick={() => onToggle(opt as T)}
                className={cn(
                  'filter-button cursor-pointer rounded-lg border-none px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out',
                  active
                    ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    : 'bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-gray-500',
                  getButtonClassName?.(opt as T, active)
                )}
                style={finalStyle as MotionStyle}
                disabled={getButtonDisabled?.(opt as T, active)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {labelNode}
              </m.button>
            );
            return renderOption ? renderOption(opt as T, button) : button;
          })}
        </div>
      </div>
    </div>
  );
}
