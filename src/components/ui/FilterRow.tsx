import React, { ReactNode } from 'react';
import clsx from 'clsx';

export type FilterRowProps<T extends string | number> = {
  label: string;
  options: readonly T[] | T[];
  isActive: (opt: T) => boolean;
  onToggle: (opt: T) => void;
  // Optional wrappers and styling
  renderOption?: (opt: T, button: ReactNode) => ReactNode;
  getButtonClassName?: (opt: T, active: boolean) => string;
  getButtonStyle?: (opt: T, active: boolean) => React.CSSProperties | undefined;
  // Container overrides
  className?: string;
  innerClassName?: string;
  // Accessibility
  ariaLabel?: string;
  // Theme
  isDarkMode?: boolean;
};

export default function FilterRow<T extends string | number>(props: FilterRowProps<T>) {
  const {
    label,
    options,
    isActive,
    onToggle,
    renderOption,
    getButtonClassName,
    getButtonStyle,
    className,
    innerClassName,
    ariaLabel,
    isDarkMode,
  } = props;

  return (
    <div
      className={clsx(
        'filter-section flex flex-col md:flex-row md:items-center gap-2 md:gap-4',
        className
      )}
    >
      <div className='label-col w-full md:w-32 text-left'>
        <div className='font-medium'>{label}</div>
      </div>
      <div className='w-full min-w-0 flex justify-center'>
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
              >
                {String(opt)}
              </button>
            );
            return renderOption ? renderOption(opt as T, button) : button;
          })}
        </div>
      </div>
    </div>
  );
}
