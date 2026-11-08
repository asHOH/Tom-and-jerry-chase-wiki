import { fireEvent, render, screen } from '@testing-library/react';

import PropertySelector from './PropertySelector';

const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => push.mockClear());

it('carries the view and custom columns to another ranking and faction', () => {
  const onPropertyChange = jest.fn();
  render(
    <PropertySelector
      currentProperty='maxHp'
      view='table'
      tableColumns={['sex', 'character', 'clawKnifeCdHit']}
      onPropertyChange={onPropertyChange}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: '跳跃速度' }));
  expect(onPropertyChange).toHaveBeenCalledWith('jumpSpeed');
  expect(push).toHaveBeenCalledWith(
    '/ranks/jumpSpeed?view=table&layout=custom&column=sex&column=character&column=clawKnifeCdHit',
    { scroll: false }
  );
  fireEvent.click(screen.getByRole('button', { name: '仅鼠阵营' }));
  expect(push).toHaveBeenLastCalledWith(
    '/ranks/maxHp?faction=mouse&view=table&layout=custom&column=sex&column=character&column=clawKnifeCdHit'
  );
});
