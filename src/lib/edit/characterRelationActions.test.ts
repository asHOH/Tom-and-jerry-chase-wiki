import { getCharacterRelationKey } from '@/data/characterRelations';
import type { CharacterRelationTrait } from '@/data/types';

import {
  getCharacterRelationActionCharacterIds,
  isCharacterRelationAction,
  splitCharacterRelationActionHistory,
} from './characterRelationActions';
import type { ActionHistoryEntry } from './diffUtils';

const trait: CharacterRelationTrait = {
  description: 'test relation',
  relation: {
    kind: 'counters',
    subject: { name: '杰瑞', type: 'character' },
    target: { name: '汤姆', type: 'character' },
    isMinor: false,
  },
};
const relationPath = getCharacterRelationKey(trait);

describe('characterRelationActions', () => {
  it('accepts whole canonical relation entry actions', () => {
    expect(
      isCharacterRelationAction({
        op: 'set',
        path: relationPath,
        oldValue: trait,
        newValue: { ...trait, description: 'updated' },
      })
    ).toBe(true);
  });

  it('rejects deprecated Character relation paths and nested relation writes', () => {
    expect(
      isCharacterRelationAction({
        op: 'set',
        path: '杰瑞.counters',
        oldValue: [],
        newValue: [{ id: '汤姆' }],
      })
    ).toBe(false);
    expect(
      isCharacterRelationAction({
        op: 'set',
        path: `${relationPath}.description`,
        oldValue: 'old',
        newValue: 'new',
      })
    ).toBe(false);
  });

  it('rejects canonical entries whose target domain does not match the relation kind', () => {
    const invalidTrait: CharacterRelationTrait = {
      ...trait,
      relation: {
        ...trait.relation,
        target: { name: '经典之家I', type: 'map' },
      },
    };

    expect(
      isCharacterRelationAction({
        op: 'add',
        path: getCharacterRelationKey(invalidTrait),
        oldValue: undefined,
        newValue: invalidTrait,
      })
    ).toBe(false);
  });

  it('extracts both character participants for scoped permission checks', () => {
    expect(
      getCharacterRelationActionCharacterIds({
        op: 'add',
        path: relationPath,
        oldValue: undefined,
        newValue: trait,
      })
    ).toEqual(['杰瑞', '汤姆']);
  });

  it('splits canonical relation history without accepting unrelated entries', () => {
    const relationAction = {
      op: 'add' as const,
      path: relationPath,
      oldValue: undefined,
      newValue: trait,
    };
    const unrelatedAction = {
      op: 'set' as const,
      path: '杰瑞.description',
      oldValue: 'old',
      newValue: 'new',
    };
    const history: ActionHistoryEntry[] = [[relationAction, unrelatedAction]];

    expect(splitCharacterRelationActionHistory(history)).toEqual({
      matching: [relationAction],
      remaining: [unrelatedAction],
    });
  });
});
