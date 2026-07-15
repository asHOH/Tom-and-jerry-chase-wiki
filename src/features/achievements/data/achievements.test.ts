import { achievements } from '@/data';

describe('achievements', () => {
  it('should keep cat and mouse achievements in separate faction records', () => {
    expect(achievements.cat.翻盘).toMatchObject({
      name: '翻盘',
      factionId: 'cat',
      score: 200,
      description: '猫在逃脱期获得胜利',
    });
    expect(achievements.mouse.翻盘).toMatchObject({
      name: '翻盘',
      factionId: 'mouse',
      score: 200,
      description: '老鼠剩余2只进入逃脱期并最终逃跑',
    });
  });

  it('should expose all supplied achievement entries and scores', () => {
    expect(Object.keys(achievements.cat)).toHaveLength(16);
    expect(Object.keys(achievements.mouse)).toHaveLength(17);
    expect(achievements.cat.四抓!.score).toBe(800);
    expect(achievements.mouse['坑！']!.score).toBe(-50);
  });
});
