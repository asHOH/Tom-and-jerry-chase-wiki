import { render, screen } from '@testing-library/react';

import {
  createRelationSelectHandler,
  RelationSelectorSlot,
  RelationSelectorToolbar,
} from './characterRelationSelectorControls';

describe('characterRelationSelectorControls', () => {
  it('renders selector controls inside a shared toolbar and titled slot', () => {
    render(
      <RelationSelectorToolbar>
        <RelationSelectorSlot title='添加角色'>
          <button type='button'>选择</button>
        </RelationSelectorSlot>
      </RelationSelectorToolbar>
    );

    const toolbar = screen.getByRole('button', { name: '选择' }).parentElement?.parentElement;

    expect(toolbar).toHaveClass('flex', 'items-center', 'gap-2');
    expect(screen.getByTitle('添加角色')).toContainElement(screen.getByRole('button'));
  });

  it('creates an add relation handler for selected item ids', () => {
    const addRelationItem = jest.fn();
    const createRelationItem = jest.fn((id: string) => ({
      id,
      isMinor: false,
    }));

    const handleSelect = createRelationSelectHandler({
      characterId: 'tom',
      relationKind: 'advantageMaps',
      addRelationItem,
      createRelationItem,
    });

    handleSelect('经典之家');

    expect(createRelationItem).toHaveBeenCalledWith('经典之家');
    expect(addRelationItem).toHaveBeenCalledWith('tom', 'advantageMaps', {
      id: '经典之家',
      isMinor: false,
    });
  });
});
