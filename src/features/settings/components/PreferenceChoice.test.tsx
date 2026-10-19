import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import PreferenceChoice from './PreferenceChoice';

function ThemeChoice({ label }: { label: string }) {
  const [value, setValue] = useState('light');
  return (
    <PreferenceChoice
      label={label}
      value={value}
      onChange={setValue}
      options={[
        { value: 'light', label: '浅色', description: '始终使用浅色主题' },
        { value: 'dark', label: '深色' },
      ]}
    />
  );
}

it('labels each choice and keeps selections in separate groups independent', () => {
  render(
    <>
      <ThemeChoice label='第一组主题' />
      <ThemeChoice label='第二组主题' />
    </>
  );

  const first = within(screen.getByRole('group', { name: '第一组主题' }));
  const second = within(screen.getByRole('group', { name: '第二组主题' }));

  expect(first.getByRole('radio', { name: '浅色' })).toBeChecked();
  expect(first.getByRole('radio', { name: '浅色' })).toHaveAccessibleDescription(
    '始终使用浅色主题'
  );

  fireEvent.click(first.getByText('深色'));

  expect(first.getByRole('radio', { name: '深色' })).toBeChecked();
  expect(first.getByRole('radio', { name: '浅色' })).not.toBeChecked();
  expect(second.getByRole('radio', { name: '浅色' })).toBeChecked();
  expect(second.getByRole('radio', { name: '深色' })).not.toBeChecked();
});
