import {
  CHARACTER_GAME_STAT_INFO,
  compareCharacterGameStatValues,
  getCharacterGameStats,
} from './characterRoleStats';

describe('characterRoleStats', () => {
  it('omits mechanics that do not apply to the playable character faction', () => {
    const tom = getCharacterGameStats({ id: '汤姆', factionId: 'cat' });
    const jerry = getCharacterGameStats({ id: '杰瑞', factionId: 'mouse' });

    expect(tom.cheesePushSpeed).toBeUndefined();
    expect(tom.wallCrackDamageBoost).toBeUndefined();
    expect(jerry.clawKnifeCdHit).toBeUndefined();
    expect(jerry.attackBoost).toBe(15);
  });

  it('uses Character.factionId rather than canonical physics metadata for restrictions', () => {
    const stats = getCharacterGameStats({ id: '兔子大表哥', factionId: 'mouse' });

    expect(stats.clawKnifeCdHit).toBeUndefined();
  });

  it('treats lower cooldowns as better', () => {
    const jade = getCharacterGameStats({ id: '如玉', factionId: 'cat' });
    const surui = getCharacterGameStats({ id: '苏蕊', factionId: 'cat' });

    expect(
      compareCharacterGameStatValues(jade.clawKnifeCdHit!, surui.clawKnifeCdHit!, 'clawKnifeCdHit')
    ).toBe('left');
    expect(CHARACTER_GAME_STAT_INFO.clawKnifeCdHit.higherIsBetter).toBe(false);
  });

  it('compares and ties jump heights using the displayed integer', () => {
    const tom = getCharacterGameStats({ id: '汤姆', factionId: 'cat' });
    const butch = getCharacterGameStats({ id: '布奇', factionId: 'cat' });

    expect(tom.jumpHeight).toBe(483);
    expect(butch.jumpHeight).toBe(483);
    expect(compareCharacterGameStatValues(tom.jumpHeight!, butch.jumpHeight!, 'jumpHeight')).toBe(
      'tie'
    );
  });
});
