import { cards } from '@/data/static';

import {
  buildCharacterItems,
  buildKnowledgeCardItems,
  sortByImportance,
} from './characterRelationViewModel';

describe('characterRelationViewModel', () => {
  it('should build editable character display items with relation callbacks', () => {
    const navigate = jest.fn();
    const toggleMinor = jest.fn();
    const remove = jest.fn();
    const updateDescription = jest.fn();

    const [item] = buildCharacterItems(
      [{ id: 'target-a', description: 'strong against', isMinor: true }],
      (id) => `/images/${id}.png`,
      navigate,
      {
        view: (id) => `view ${id}`,
        edit: (id) => `edit ${id}`,
      },
      {
        relationKind: 'counters',
        isEditable: true,
        getDescriptionPath: (index) => `relations.${index}`,
        onToggleMinor: toggleMinor,
        onRemove: remove,
        onUpdateDescription: updateDescription,
      }
    );

    expect(item).toMatchObject({
      type: 'character',
      key: 'character-target-a',
      id: 'target-a',
      description: 'strong against',
      isMinor: true,
      imageSrc: '/images/target-a.png',
      isEditable: true,
      relationKind: 'counters',
      descriptionPath: 'relations.0',
    });
    expect(item?.getAriaLabel(false)).toBe('view target-a');
    expect(item?.getAriaLabel(true)).toBe('edit target-a');

    item?.onNavigate();
    item?.onToggleMinor?.();
    item?.onRemove?.();
    item?.onUpdateDescription?.('updated');

    expect(navigate).toHaveBeenCalledWith('target-a');
    expect(toggleMinor).toHaveBeenCalledWith('target-a');
    expect(remove).toHaveBeenCalledWith('target-a');
    expect(updateDescription).toHaveBeenCalledWith('target-a', 'updated');
  });

  it('should build knowledge card display items and keep major items first', () => {
    const navigate = jest.fn();
    const [minorCardId, majorCardId] = Object.keys(cards);

    expect(minorCardId).toBeDefined();
    expect(majorCardId).toBeDefined();

    const items = sortByImportance(
      buildKnowledgeCardItems(
        [
          { id: minorCardId!, description: 'later', isMinor: true },
          { id: majorCardId!, description: 'first', isMinor: false },
        ],
        navigate,
        {
          relationKind: 'counteredByKnowledgeCards',
          isEditable: true,
          getDescriptionPath: (index) => `cards.${index}`,
        }
      )
    );

    expect(items.map((item) => item.id)).toEqual([majorCardId, minorCardId]);
    expect(items[0]).toMatchObject({
      type: 'knowledgeCard',
      key: `knowledgeCard-${majorCardId}`,
      relationKind: 'counteredByKnowledgeCards',
      descriptionPath: 'cards.1',
    });

    items[0]?.onNavigate();

    expect(navigate).toHaveBeenCalledWith(majorCardId);
  });
});
