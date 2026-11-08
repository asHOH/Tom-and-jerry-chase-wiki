import { fireEvent, render, screen } from '@testing-library/react';

import { getAllowedCharacterRelationTags } from '@/features/characters/utils/characterRelationTags';

import CharacterRelationTagSelect from './CharacterRelationTagSelect';

it('keeps an incompatible saved value visible but unavailable for selection', () => {
  const onChange = jest.fn();
  render(
    <CharacterRelationTagSelect
      value='拉扯'
      options={getAllowedCharacterRelationTags('cat', 'counters')}
      onChange={onChange}
      aria-label='分类'
    />
  );
  expect(screen.getByLabelText('分类')).toHaveValue('拉扯');
  expect(screen.getByRole('option', { name: '拉扯（当前方向不可用）' })).toBeDisabled();
  expect(screen.queryByRole('option', { name: '稳救' })).not.toBeInTheDocument();
  expect(screen.getByRole('option', { name: '大视野' })).toBeEnabled();
  fireEvent.change(screen.getByLabelText('分类'), { target: { value: '拉扯' } });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('分类'), { target: { value: '追击' } });
  expect(onChange).toHaveBeenCalledWith('追击');
});
