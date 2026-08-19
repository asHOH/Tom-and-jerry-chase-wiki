'use client';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';

type PreferenceOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type PreferenceChoiceProps<T extends string> = {
  label: string;
  value: T;
  options: readonly PreferenceOption<T>[];
  onChange: (value: T) => void;
};

export default function PreferenceChoice<T extends string>({
  label,
  value,
  options,
  onChange,
}: PreferenceChoiceProps<T>) {
  return (
    <fieldset>
      <legend className='mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100'>
        {label}
      </legend>
      <div className='grid gap-2 sm:grid-cols-3'>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Button
              variant='unstyled'
              key={option.value}
              type='button'
              role='radio'
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-lg border px-3 py-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                selected
                  ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-100'
                  : 'border-border bg-surface hover:bg-control text-gray-700 dark:text-gray-300'
              )}
            >
              <span className='block text-sm font-medium'>{option.label}</span>
              {option.description ? (
                <span className='mt-1 block text-xs leading-5 opacity-75'>
                  {option.description}
                </span>
              ) : null}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
