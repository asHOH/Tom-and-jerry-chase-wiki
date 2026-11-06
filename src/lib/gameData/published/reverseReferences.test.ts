import { decodeStoredActionRow } from '@/lib/gameData/actionRowDecoder';
import singleItemReverse from '@/lib/singleItemReverse';

import { createApprovedActionSnapshot } from './approvedActionSnapshot';
import { getCanonicalGameData } from './canonicalSources';
import { selectPublishedGameData } from './selectPublishedDomain';

jest.mock('server-only', () => ({}));

const target = { name: '经验蛋糕', type: 'item' } as const;
const mention = '新增描述提到{经验蛋糕}。';

function characterEdit(id: string, description: string) {
  const decoded = decodeStoredActionRow({
    id,
    entry: { op: 'set', path: '汤姆.skills.0.description', newValue: description },
  });
  if (!decoded.success) throw new Error(decoded.error.message);
  return { entityType: 'characters', decodedRow: decoded.value };
}

it('characterizes the baseline-only lookup when a published skill adds the first reference', () => {
  const canonical = getCanonicalGameData('characters');
  const addition = characterEdit('add-reference', mention);
  const removal = characterEdit('remove-reference', '引用已移除');
  for (const [rows, description] of [
    [[addition], mention],
    [[addition, removal], '引用已移除'],
  ] as const) {
    const snapshot = createApprovedActionSnapshot(rows);
    const characters = selectPublishedGameData('characters', canonical, snapshot);
    expect(characters['汤姆']?.skills[0]?.description).toBe(description);
    expect(singleItemReverse(target)).toEqual([]);
  }
});
