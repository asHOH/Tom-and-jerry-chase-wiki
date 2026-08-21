import { getCharacterContributorIndex } from '@/lib/gameData/characterContributorIndex';
import { contributors } from '@/data/contributors';
import { getContentWritersByCharacter } from '@/constants';

import { getContentWritersForCharacter } from './contentWriters';

jest.mock('@/lib/gameData/characterContributorIndex', () => ({
  getCharacterContributorIndex: jest.fn(),
}));
jest.mock('@/constants', () => ({
  getContentWritersByCharacter: jest.fn(),
}));
jest.mock('@/data/contributors', () => ({
  RoleType: { ContentWriter: 'content-writer' },
  contributors: [],
}));

const getIndexMock = jest.mocked(getCharacterContributorIndex);
const getStaticWritersMock = jest.mocked(getContentWritersByCharacter);
const mockedContributors = contributors as unknown as Array<{
  id: string;
  roles: Array<{ type: string; characters?: string[] }>;
}>;

describe('character content writers', () => {
  beforeEach(() => {
    getStaticWritersMock.mockReturnValue(['静态作者', '静态作者']);
    mockedContributors.length = 0;
    mockedContributors.push({
      id: 'static-id',
      roles: [{ type: 'content-writer', characters: ['汤姆'] }],
    });
    getIndexMock.mockResolvedValue({
      汤姆: [
        { id: 'static-id', name: '另一个名称', contributionCount: 9 },
        { id: 'dynamic-static-name', name: '静态作者', contributionCount: 8 },
        { id: 'dynamic-a', name: '动态作者', contributionCount: 7 },
        { id: 'dynamic-duplicate', name: '动态作者', contributionCount: 6 },
        { id: 'dynamic-b', name: '第二作者', contributionCount: 5 },
      ],
    });
  });

  it('preserves static-author and duplicate-name filtering with the global index', async () => {
    await expect(getContentWritersForCharacter('汤姆')).resolves.toEqual({
      writers: ['静态作者', '动态作者', '第二作者'],
      editors: [
        { id: 'dynamic-a', name: '动态作者' },
        { id: 'dynamic-b', name: '第二作者' },
      ],
    });
  });

  it('falls back to static authors when contributor acquisition fails', async () => {
    getIndexMock.mockRejectedValue(new Error('unavailable'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(getContentWritersForCharacter('汤姆')).resolves.toEqual({
      writers: ['静态作者'],
      editors: [],
    });
  });
});
