import { fireEvent, render, screen } from '@testing-library/react';

import { createGameActionDiff, formatGameActionUnifiedDiff } from '../utils/gameActionDiff';
import { GameDataActionChangeViewer } from './GameDataActionPreviewList';

it('folds unchanged skill moves, allows raw review, and copies the complete stored diff', () => {
  const skill = { id: 'test-weapon1', name: '剑盾防御', type: 'weapon1', skillLevels: [] };
  const entry = {
    op: 'set',
    path: '剑客汤姆.skills',
    oldValue: [{ ...skill, aftercast: 0.9 }],
    newValue: [{ ...skill, parts: [{ aftercast: 0.9 }], aliases: ['能防泰菲的地雷'] }],
  };
  const onCopyText = jest.fn();
  render(
    <GameDataActionChangeViewer
      entry={entry}
      entityType='characters'
      view='unified'
      showAllContext={false}
      onCopyText={onCopyText}
    />
  );

  expect(screen.getByText(/数值未变/)).toBeInTheDocument();
  expect(screen.getByText('-0')).toBeInTheDocument();
  const toggle = screen.getByRole('checkbox', { name: '显示原始结构差异' });
  fireEvent.click(toggle);
  expect(toggle).toBeChecked();
  expect(screen.queryByText('-0')).not.toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.getByText('-0')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '复制原始差异' }));
  expect(onCopyText).toHaveBeenLastCalledWith(
    formatGameActionUnifiedDiff(
      createGameActionDiff(entry.oldValue, entry.newValue),
      'characters/剑客汤姆.skills',
      false
    )
  );
  fireEvent.click(screen.getByRole('button', { name: '复制旧值' }));
  expect(JSON.parse(onCopyText.mock.calls.at(-1)![0])).toEqual(entry.oldValue);
});
