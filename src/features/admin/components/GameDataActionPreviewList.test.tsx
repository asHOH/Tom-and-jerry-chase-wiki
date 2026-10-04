import { fireEvent, render, screen } from '@testing-library/react';

import { createGameActionDiff, formatGameActionUnifiedDiff } from '../utils/gameActionDiff';
import GameDataActionPreviewList, { GameDataActionChangeViewer } from './GameDataActionPreviewList';

it.each([false, true])(
  'summarizes only the alias edit with unchanged skill movement=%s',
  (moveUsage) => {
    const before = ['active', 'weapon1', 'weapon2', 'passive'].map((type) => ({
      id: `剑客汤姆-${type}`,
      name: type === 'weapon1' ? '剑盾防御' : type,
      type,
      skillLevels: [{ level: 1, description: 'unchanged' }],
      ...(type === 'active' ? { aliases: ['冲刺'] } : {}),
      ...(type === 'weapon1' || type === 'weapon2'
        ? { aftercast: 0.9, cancelableAftercast: ['道具键*', '道具键'] }
        : {}),
    }));
    const after = JSON.parse(JSON.stringify(before));
    after[1].aliases = ['能防泰菲的地雷'];
    if (moveUsage) {
      after[1].parts = [
        { aftercast: after[1].aftercast, cancelableAftercast: after[1].cancelableAftercast },
      ];
      delete after[1].aftercast;
      delete after[1].cancelableAftercast;
    }
    render(
      <GameDataActionPreviewList
        entityType='characters'
        entry={{ op: 'set', path: '剑客汤姆.skills', oldValue: before, newValue: after }}
      />
    );
    expect(screen.getByText('剑客汤姆-weapon1').closest('li')).toHaveTextContent(
      /^剑客汤姆-weapon1：aliases$/
    );
    for (const type of ['active', 'weapon2', 'passive']) {
      expect(screen.queryByText(`剑客汤姆-${type}`)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/结构调整（数值未变）/) !== null).toBe(moveUsage);
  }
);

it('keeps a structure-only skill adjustment visible without claiming changed values', () => {
  const skill = { id: 'test-weapon1', name: '剑盾防御', type: 'weapon1', skillLevels: [] };
  render(
    <GameDataActionPreviewList
      entityType='characters'
      entry={{
        op: 'set',
        path: 'test.skills',
        oldValue: [{ ...skill, aftercast: 0.9 }],
        newValue: [{ ...skill, parts: [{ aftercast: 0.9 }] }],
      }}
    />
  );
  expect(screen.queryByText('变更字段：')).not.toBeInTheDocument();
  expect(screen.getByText(/结构调整（数值未变）/)).toBeInTheDocument();
});

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
