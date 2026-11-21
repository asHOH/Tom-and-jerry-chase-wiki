import type { Trait } from '@/data/types';

import { pickDailyTrait } from './dailyTrait';

const createTrait = (description: string, relation?: Trait['relation']): Trait => ({
  description,
  group: [{ name: '汤姆', type: 'character' }],
  ...(relation ? { relation } : {}),
});

const createTraits = () => ({
  甲: createTrait('甲的描述'),
  乙: createTrait('乙的描述'),
  丙: createTrait('丙的描述'),
});

describe('pickDailyTrait', () => {
  it('returns the same trait for the same date', () => {
    const traits = createTraits();
    const date = new Date(2026, 10, 22);

    const first = pickDailyTrait(traits, date);
    const second = pickDailyTrait(traits, date);

    expect(first).not.toBeNull();
    expect(second?.traitKey).toBe(first?.traitKey);
    expect(second?.dateKey).toBe('2026-11-22');
  });

  it('ignores the insertion order of the traits record', () => {
    const date = new Date(2026, 10, 22);
    const forward = pickDailyTrait(createTraits(), date);
    const reversed = pickDailyTrait(
      Object.fromEntries(Object.entries(createTraits()).reverse()),
      date
    );

    expect(reversed?.traitKey).toBe(forward?.traitKey);
  });

  it('never selects traits that are only relation entries', () => {
    const relationTrait = createTrait('关系描述', {
      kind: 'counters',
      subject: { name: '汤姆', type: 'character' },
      target: { name: '杰瑞', type: 'character' },
    });
    const traits = { 关系: relationTrait, 普通特性: createTrait('普通描述') };

    for (let day = 0; day < 30; day += 1) {
      expect(pickDailyTrait(traits, new Date(2026, 0, day + 1))?.traitKey).toBe('普通特性');
    }
  });

  it('returns null when there are no selectable traits', () => {
    expect(pickDailyTrait({}, new Date(2026, 10, 22))).toBeNull();
  });

  it('rotates through more than one trait across days', () => {
    const traits = createTraits();
    const selected = new Set<string>();

    for (let day = 0; day < 30; day += 1) {
      const selection = pickDailyTrait(traits, new Date(2026, 0, day + 1));
      expect(selection).not.toBeNull();
      selected.add(selection!.traitKey);
    }

    expect(selected.size).toBeGreaterThan(1);
  });
});
