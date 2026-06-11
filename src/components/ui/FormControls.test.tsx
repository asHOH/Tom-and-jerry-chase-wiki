import React from 'react';
import { render, screen } from '@testing-library/react';

import { FormInput, FormSelect, FormTextarea } from './FormControls';

describe('FormControls', () => {
  it('renders an input with shared form-control styling and ref forwarding', () => {
    const ref = React.createRef<HTMLInputElement>();

    render(<FormInput ref={ref} aria-label='标题' className='md:px-4' />);

    const input = screen.getByRole('textbox', { name: '标题' });
    expect(input).toHaveClass('w-full', 'rounded-lg', 'px-3', 'py-3', 'md:px-4');
    expect(ref.current).toBe(input);
  });

  it('renders a select with compact shared styling', () => {
    render(
      <FormSelect aria-label='分类' size='sm' defaultValue='guide'>
        <option value='guide'>攻略</option>
      </FormSelect>
    );

    const select = screen.getByRole('combobox', { name: '分类' });
    expect(select).toHaveClass('w-full', 'rounded-lg', 'px-2', 'py-2', 'text-sm');
  });

  it('renders a textarea with invalid state semantics and styling', () => {
    render(<FormTextarea aria-label='说明' invalid />);

    const textarea = screen.getByRole('textbox', { name: '说明' });
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveClass('border-red-500', 'focus:ring-red-500');
  });
});
