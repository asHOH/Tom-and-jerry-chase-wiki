import { toRankingCsv } from './rankingCsv';

it('escapes CSV fields and includes a UTF-8 BOM', () => {
  expect(
    toRankingCsv([
      ['角色', '备注'],
      ['汤姆', '逗号,引号"和\n换行'],
      ['杰瑞', '—'],
    ])
  ).toBe('\uFEFF角色,备注\r\n汤姆,"逗号,引号""和\n换行"\r\n杰瑞,—');
});
