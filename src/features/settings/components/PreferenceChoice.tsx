'use client';

import { useId } from 'react';

import { cn, getSelectionControlClasses } from '@/lib/design';

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
  const groupName = useId();

  return (
    <fieldset>
      <legend className='mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100'>
        {label}
      </legend>
      <div className='grid gap-2 sm:grid-cols-3'>
        {options.map((option) => {
          const selected = option.value === value;
          const optionId = `${groupName}-${option.value}`;
          return (
            <label key={option.value} className='cursor-pointer'>
              <input
                type='radio'
                name={groupName}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                aria-labelledby={`${optionId}-label`}
                aria-describedby={option.description ? `${optionId}-description` : undefined}
                className='peer sr-only focus:outline-none'
              />
              <span
                className={cn(
                  getSelectionControlClasses(selected),
                  'peer-focus-visible:ring-focus block h-full rounded-lg px-3 py-3 text-left peer-focus-visible:ring-2'
                )}
              >
                <span id={`${optionId}-label`} className='block text-sm font-medium'>
                  {option.label}
                </span>
                {option.description ? (
                  <span
                    id={`${optionId}-description`}
                    className='mt-1 block text-xs leading-5 opacity-75'
                  >
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
