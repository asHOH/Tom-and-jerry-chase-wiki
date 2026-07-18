import { render, screen, within } from '@testing-library/react';

import GameDataActionVisualDiff, { flattenActions } from './GameDataActionVisualDiff';

describe('GameDataActionVisualDiff', () => {
  it('renders scalar field changes with before and after colors', () => {
    render(
      <GameDataActionVisualDiff
        entry={{
          op: 'set',
          path: '汤姆.description',
          oldValue: '旧描述',
          newValue: '新描述',
        }}
      />
    );

    expect(screen.getByText('字段：汤姆.description')).toBeInTheDocument();
    expect(screen.getByText('旧描述').closest('div')).toHaveClass('bg-red-50');
    expect(screen.getByText('新描述').closest('div')).toHaveClass('bg-green-50');
  });

  it('matches keyed collections and marks every nested field change', () => {
    render(
      <GameDataActionVisualDiff
        entry={{
          op: 'set',
          path: '汤姆.skillAllocations',
          oldValue: [
            { id: '常规', pattern: '121212000', description: '旧说明' },
            { id: '移除方案', pattern: '111222000' },
            { id: '保持不变', pattern: '000000000' },
          ],
          newValue: [
            { id: '常规', pattern: '122112000', description: '新说明' },
            { id: '新增方案', pattern: '222111000' },
            { id: '保持不变', pattern: '000000000' },
          ],
        }}
      />
    );

    const changed = screen.getByRole('heading', { name: '常规' }).closest('section');
    expect(changed).toHaveClass('bg-amber-50');
    expect(within(changed!).getByText('pattern')).toBeInTheDocument();
    expect(within(changed!).getByText('description')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '移除方案' }).closest('section')).toHaveClass(
      'bg-red-50'
    );
    expect(screen.getByRole('heading', { name: '新增方案' }).closest('section')).toHaveClass(
      'bg-green-50'
    );
    expect(screen.queryByRole('heading', { name: '保持不变' })).not.toBeInTheDocument();
  });

  it('supports arbitrary nested objects, unkeyed arrays, additions, and removals', () => {
    render(
      <GameDataActionVisualDiff
        entry={{
          op: 'set',
          path: '任意实体.metadata',
          oldValue: { nested: { enabled: false }, values: ['A', 'B'], removed: 1 },
          newValue: { nested: { enabled: true }, values: ['A', 'C'], added: 2 },
        }}
      />
    );

    expect(screen.getByText('enabled')).toBeInTheDocument();
    expect(screen.getByText('第 2 项')).toBeInTheDocument();
    expect(screen.getByText('removed')).toBeInTheDocument();
    expect(screen.getByText('added')).toBeInTheDocument();
  });

  it('flattens legacy and batched action entry shapes', () => {
    const first = { op: 'set' as const, path: 'A.value', oldValue: 1, newValue: 2 };
    const second = { op: 'add' as const, path: 'B.value', oldValue: undefined, newValue: 3 };

    expect(flattenActions([first, [second], { invalid: true }])).toEqual([first, second]);
  });
});
