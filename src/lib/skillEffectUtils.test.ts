import { stripStatusClauses } from './skillEffectUtils';

describe('stripStatusClauses', () => {
  describe('wiki-tooltip patterns', () => {
    it('should remove 可被[免疫](...) clause', () => {
      const input = '“测试技能”：移速×0.7；可被[免疫](会被“眩晕”免疫)；该状态隶属于分组3。';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('可被[免疫]');
      expect(result).not.toContain('免疫)');
    });

    it('should remove 可被[清除](...) clause', () => {
      const input = '“测试技能”：眩晕；可被[清除](会被“大星星”清除)；该状态隶属于分组16。';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('可被[清除]');
      expect(result).not.toContain('清除)');
    });

    it('should remove 免疫[部分状态](...) clause at start of description', () => {
      const input = '“电免疫”：免疫[部分状态](“电”、“感电”)；持续5秒';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('[部分状态]');
      expect(result).toContain('“电免疫”：持续5秒');
    });

    it('should remove 清除[部分状态](...) clause at start of description', () => {
      const input = '“[驱散-1](不在状态栏显示)”：清除[部分状态](“猫隐身-1”、“变身”)；持续10秒';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('[部分状态]');
      expect(result).toContain('持续10秒');
    });

    it('should remove 免疫[部分状态](...) clause mid-description', () => {
      const input = '“护盾”：获得2层护盾；免疫[部分状态](“冰冻-3”、“鞭炮爆炸-3”)；持续90秒';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('[部分状态]');
      expect(result).toContain('获得2层护盾；持续90秒');
    });
  });

  describe('会被 Chinese-quoted patterns', () => {
    it('should remove standalone 会被"x"免疫 clause', () => {
      const input = '“测试技能”：眩晕；持续2.5秒；会被“火箭屏蔽BUFF”免疫；可被[清除](...)';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('会被');
      expect(result).not.toContain('火箭屏蔽BUFF');
    });

    it('should remove standalone 会被"x"清除 clause', () => {
      const input = '“测试技能”：回复50HP；持续40秒；会被“驱散-1”清除；该状态隶属于分组2,3,4。';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('会被');
      expect(result).not.toContain('驱散-1');
    });

    it('should remove consecutive 会被 clauses', () => {
      const input = '“暴露位置”：暴露位置；持续10秒；会被“免疫buff313”免疫；会被“免疫buff313”清除';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('会被');
      expect(result).not.toContain('免疫buff313');
      expect(result).toContain('暴露位置');
      expect(result).toContain('持续10秒');
    });
  });

  describe('免疫/清除 Chinese-quoted patterns', () => {
    it('should remove 免疫"x" clause', () => {
      const input = '“测试技能”：眩晕；掉落道具和老鼠；免疫“老鼠跟随”；需挣扎5秒以解除本状态';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('免疫“老鼠跟随”');
      expect(result).toContain('需挣扎5秒以解除本状态');
    });

    it('should remove 清除"x" clause', () => {
      const input = '“测试技能”：禁用技能；清除“变身道具-1,2”；需挣扎5秒以解除本状态';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('清除“变身道具-1,2”');
      expect(result).toContain('需挣扎5秒以解除本状态');
    });

    it('should remove multi-item 清除"x"、"y" clause', () => {
      const input = '“测试技能”：回复50HP；清除“香水反向-1,2”、“调料罐失明-1,2”；持续40秒';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('香水反向');
      expect(result).not.toContain('调料罐失明');
      expect(result).toContain('回复50HP；持续40秒');
    });
  });

  describe('该状态隶属于 grouping pattern', () => {
    it('should remove 该状态隶属于分组X clause', () => {
      const input = '“测试技能”：移速×0.7；该状态隶属于分组3。';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('该状态隶属于');
      expect(result).not.toContain('分组3');
    });

    it('should remove 该状态隶属于分组X,Y,Z clause', () => {
      const input = '“测试技能”：攻击力+100；该状态隶属于分组1,2,3,10。';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('该状态隶属于');
    });
  });

  describe('plain-text 清除 pattern', () => {
    it('should remove 清除{plain} after {} stripping', () => {
      // After {} stripping, {吻痕} → 吻痕, so the text becomes ;清除吻痕;
      const input = '“测试技能”：眩晕；掉落道具；清除吻痕；持续1.5秒';
      const result = stripStatusClauses(input);
      expect(result).not.toContain('清除吻痕');
      expect(result).toContain('眩晕');
      expect(result).toContain('持续1.5秒');
    });
  });

  describe('pass-through of non-status content', () => {
    it('should preserve skill effect descriptions', () => {
      const input = '“加速-1”：回复25HP；移速×1.05；跳跃能力×1.05；持续30秒';
      const result = stripStatusClauses(input);
      expect(result).toContain('回复25HP');
      expect(result).toContain('移速×1.05');
      expect(result).toContain('跳跃能力×1.05');
      expect(result).toContain('持续30秒');
    });

    it('should preserve buff name header', () => {
      const input = '“[搬起大奶酪减速-1](不在状态栏显示)”：移速×0.7；禁止购物';
      const result = stripStatusClauses(input);
      expect(result).toContain('搬起大奶酪减速-1');
      expect(result).toContain('不在状态栏显示');
      expect(result).toContain('移速×0.7');
    });

    it('should return empty string when only status clauses present', () => {
      const input = '该状态隶属于分组3。';
      const result = stripStatusClauses(input);
      expect(result).toBe('');
    });

    it('should handle text with no status clauses', () => {
      const input = '“技能名”：移速×1.2；攻击力+50；持续20秒';
      const result = stripStatusClauses(input);
      expect(result).toBe(input);
    });
  });

  describe('cleanup', () => {
    it('should collapse double semicolons from consecutive removals', () => {
      // Adjacent status clauses sharing separators can leave ;;
      const input = '“技能”：移速×0.7；可被[免疫](会被“眩晕”免疫)；可被[清除](会被“大星星”清除)';
      const result = stripStatusClauses(input);
      expect(result).not.toContain(';;');
      expect(result).not.toContain('；；');
      expect(result).toContain('移速×0.7');
    });

    it('should trim trailing punctuation', () => {
      const input = '“技能”：移速×0.7；该状态隶属于分组3。';
      const result = stripStatusClauses(input);
      expect(result).not.toMatch(/[。；;]$/);
    });
  });
});
