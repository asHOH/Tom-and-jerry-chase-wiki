import { fireEvent, render, screen } from '@testing-library/react';

import { getHistory } from '@/lib/historyUtils';
import { ChangeType } from '@/data/types';

import CharacterHistoryDisplay from './CharacterHistoryDisplay';
import LocalCharacterHistoryDisplay from './LocalCharacterHistoryDisplay';

it('renders supplied entries in date order and preserves collapse behavior', () => {
  render(
    <CharacterHistoryDisplay
      history={[
        { year: 2025, date: '1.1', season: '旧赛季', type: 'new' },
        {
          year: 2026,
          date: '3.1-3.7',
          season: '新赛季',
          type: ChangeType.BUFF,
          description: '调整说明',
        },
      ]}
    />
  );
  const button = screen.getByRole('button', { name: '角色历史记录' });
  expect(button).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(button);
  expect(screen.getByText('2026.3.1-3.7 (新赛季)').closest('li')).toHaveClass('text-blue-600');
  expect(screen.getByText('2025.1.1 (旧赛季)').closest('li')).toHaveTextContent('上线');
  fireEvent.click(button);
  expect(screen.queryByText('2026.3.1-3.7 (新赛季)')).not.toBeInTheDocument();
});

it('uses aliases in the local fallback and recomputes when names change', () => {
  expect(getHistory(['剑客杰瑞']).length).toBeGreaterThan(0);
  const { rerender } = render(<LocalCharacterHistoryDisplay names={['本地角色', '剑客杰瑞']} />);
  fireEvent.click(screen.getByRole('button', { name: '角色历史记录' }));
  const expected = getHistory(['本地角色', '剑客杰瑞']);
  expect(screen.getAllByText(/\(.*\)/, { selector: 'strong' })).toHaveLength(expected.length);
  rerender(<LocalCharacterHistoryDisplay names={['没有历史记录的本地角色']} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
