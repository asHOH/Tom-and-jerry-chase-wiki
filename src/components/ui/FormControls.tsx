'use client';

import React, { forwardRef } from 'react';

import { getFormControlClasses, type FormControlSize } from '@/lib/design';

type SharedFormControlProps = {
  size?: FormControlSize;
  invalid?: boolean;
  fullWidth?: boolean;
};

type FormInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  SharedFormControlProps;

type FormSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> &
  SharedFormControlProps;

type FormTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & SharedFormControlProps;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      invalid = false,
      size = 'md',
      fullWidth = true,
      'aria-invalid': ariaInvalid,
      ...rest
    },
    ref
  ) => (
    <input
      ref={ref}
      className={getFormControlClasses({ size, invalid, fullWidth, className })}
      aria-invalid={ariaInvalid ?? (invalid ? true : undefined)}
      {...rest}
    />
  )
);

FormInput.displayName = 'FormInput';

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      className,
      invalid = false,
      size = 'md',
      fullWidth = true,
      'aria-invalid': ariaInvalid,
      ...rest
    },
    ref
  ) => (
    <select
      ref={ref}
      className={getFormControlClasses({ size, invalid, fullWidth, className })}
      aria-invalid={ariaInvalid ?? (invalid ? true : undefined)}
      {...rest}
    />
  )
);

FormSelect.displayName = 'FormSelect';

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      className,
      invalid = false,
      size = 'md',
      fullWidth = true,
      'aria-invalid': ariaInvalid,
      ...rest
    },
    ref
  ) => (
    <textarea
      ref={ref}
      className={getFormControlClasses({ size, invalid, fullWidth, className })}
      aria-invalid={ariaInvalid ?? (invalid ? true : undefined)}
      {...rest}
    />
  )
);

FormTextarea.displayName = 'FormTextarea';
