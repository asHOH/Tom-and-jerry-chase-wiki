import React, { ReactNode } from 'react';
import clsx from 'clsx';
import FilterLabel from './FilterLabel';
import { useMobile } from '@/hooks/useMediaQuery';

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
  // Theme
  isDarkMode?: boolean | undefined;
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
    isDarkMode,
  } = props;
  const isMobile = useMobile();

  return (
    <div
      className={clsx(
        `flex justify-center items-center gap-2 ${isMobile ? 'mt-1' : 'mt-4'}`,
        className
      )}
    >
      <FilterLabel displayMode='inline'>{label}</FilterLabel>
      <FilterLabel displayMode='block'>筛选:</FilterLabel>
      {/* <div className='w-full md:w-32 text-left'>
        <div className='font-medium'>{label}</div>
      </div> */}
      <div className='flex'>
        <div
          className={clsx('flex flex-wrap gap-1 md:gap-2', innerClassName)}
          aria-label={ariaLabel || label}
        >
          {options.map((opt) => {
            const active = isActive(opt as T);
            const provided = getButtonStyle?.(opt as T, active);
            const inactiveDefaults = isDarkMode
              ? { backgroundColor: '#23272f', color: '#6b7280' }
              : { backgroundColor: '#f3f4f6', color: '#9ca3af' };
            const finalStyle = active ? provided : { ...inactiveDefaults, ...(provided || {}) };
            const labelNode = getOptionLabel ? getOptionLabel(opt as T, active) : String(opt);
            const button = (
              <button
                key={String(opt)}
                type='button'
                onClick={() => onToggle(opt as T)}
                className={clsx(
                  'filter-button px-3 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out text-sm cursor-pointer border-none',
                  getButtonClassName?.(opt as T, active)
                )}
                style={finalStyle}
                disabled={getButtonDisabled?.(opt as T, active)}
              >
                {labelNode}
              </button>
            );
            return renderOption ? renderOption(opt as T, button) : button;
          })}
        </div>
      </div>
    </div>
  );
}
