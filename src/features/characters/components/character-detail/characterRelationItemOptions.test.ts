import { createEditableRelationItemOptions } from './characterRelationItemOptions';

describe('createEditableRelationItemOptions', () => {
  it('creates relation item edit options for a character relation kind', () => {
    const getDescriptionPath = jest.fn((relationKind: string, index: number) => {
      return `characters.tom.${relationKind}.${index}`;
    });
    const onToggleMinor = jest.fn();
    const onRemove = jest.fn();
    const onUpdateDescription = jest.fn();

    const options = createEditableRelationItemOptions({
      characterId: 'tom',
      relationKind: 'counters',
      getDescriptionPath,
      onToggleMinor,
      onRemove,
      onUpdateDescription,
    });

    expect(options).toMatchObject({
      relationKind: 'counters',
      isEditable: true,
    });
    expect(options.getDescriptionPath?.(2, 'jerry')).toBe('characters.tom.counters.2');

    options.onToggleMinor?.('jerry');
    options.onRemove?.('jerry');
    options.onUpdateDescription?.('jerry', '描述');

    expect(onToggleMinor).toHaveBeenCalledWith('tom', 'counters', 'jerry');
    expect(onRemove).toHaveBeenCalledWith('tom', 'counters', 'jerry');
    expect(onUpdateDescription).toHaveBeenCalledWith('tom', 'counters', 'jerry', '描述');
  });
});
