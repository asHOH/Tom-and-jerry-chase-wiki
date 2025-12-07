import { Trait } from './types';

const traits: Record<string, Trait> = {
  /**
   * 格式说明：
   * 一条特性包括group，description和isMinor（可选）。其中group由若干个singleItem（即{name,type,factionId?}）组成
   * 可以用[]框选数个singleItem形成singleItem[]，代表"或"，也就是"其中之一"。[]最多嵌套一层。
   * type='itemGroup'时，代表加入组合，组合会在索引时进行拆解并对每个内容单独判断归属（与[]嵌套类似），在显示时只显示名称。组合可与[]进行嵌套，最多一层
   * 现已支持对type='buff'的拆解，会拆解其来源，逻辑与itemGroup类似
   * 附加格式1：spacialCase可添加特例，用于覆盖itemGroup或buff拆解而来的对象的文本。显示规则为：特例的相关文本会优先被匹配，若成功匹配中特例，则在后续匹配本体时不会拆解itemGroup和buff，反之则正常拆解。
   * 附加格式2：excludeFactionId用于在拆解itemGroup和buff时针对性删除'cat'或'mouse'阵营的拆解结果
   *
   * 填写说明：
   * singleItem的name不要用别名，否则会出现索引问题
   * factionId仅用于区分特技里的两个急速翻滚/应急治疗，平时不需要填写
   * */
  //------------------以下特性填写时间较早，采用主体命名；新填写的特性采用录入时间命名------------------/
  汤姆1: {
    group: [
      { name: '发怒冲刺', type: 'skill' },
      { name: '番茄', type: 'item' },
    ],
    description: '发怒冲刺无法解除番茄带来的减速效果。',
  },
  汤姆2: {
    group: [
      [
        { name: '蓝图(投射物)', type: 'entity' },
        { name: '线条猫', type: 'entity' },
      ],
      { name: '发怒冲刺', type: 'skill' },
    ],
    description: '发怒冲刺期间不会因被3级蓝图直接命中而导致变身为线条猫。',
  },
  汤姆4: {
    group: [
      { name: '发怒冲刺', type: 'skill' },
      { name: '星星', type: 'entity' },
      [
        { name: '蓝图(召唤物)', type: 'entity' },
        { name: '线条猫', type: 'entity' },
      ],
    ],
    description: '发怒冲刺期间在蓝图内受到伤害（例如被1/2/4/6星命中）依然会变身为线条猫。',
  },
  汤姆5: {
    group: [
      { name: '手型枪', type: 'entity' },
      [
        { name: '铁血', type: 'knowledgeCard' },
        { name: '喜剧之王', type: 'skill' },
      ],
    ],
    description: '老鼠因手型枪伤害而进入铁血或1级喜剧之王的状态时，仍会受到后续眩晕。',
  },
  汤姆6: {
    group: [
      { name: '手型枪', type: 'entity' },
      { name: '鼠虚弱', type: 'buff' },
    ],
    description:
      '手型枪可以抓回虚弱的老鼠，且[3级的直接抓起效果会正常生效](效果持续期间，汤姆爪刀命中虚弱老鼠时会将其直接抓起)。',
  },
  汤姆7: {
    group: [
      { name: '手型枪', type: 'entity' },
      { name: '比利鼠', type: 'entity' },
    ],
    description:
      '手型枪可以抓回比利鼠，且比利鼠会受到眩晕。若手型枪已满3级且比利鼠在受手型枪眩晕期间解除变身状态，则可将该老鼠直接抓起。',
  },
  布奇1: {
    group: [
      { name: '垃圾盖', type: 'skill' },
      { name: '可破碎道具', type: 'itemGroup' },
    ],
    description:
      '2级垃圾盖可以直接震碎可破碎道具（{番茄}除外）。被垃圾盖震碎的道具会产生投掷命中墙壁/地面时的破碎效果。',
  },
  布奇2: {
    group: [
      { name: '垃圾盖', type: 'skill' },
      [
        { name: '纸盒', type: 'itemGroup' },
        { name: '面粉袋', type: 'item' },
      ],
    ],
    description: '2级垃圾盖无法震碎纸盒或面粉袋。',
  },
  托普斯1: {
    group: [{ name: '托普斯分身', type: 'entity' }, [{ name: '捕鼠夹', type: 'knowledgeCard' }]],
    description: '托普斯分身继承的捕鼠夹等知识卡效果可以与托普斯自身叠加，效果因此翻倍。',
  },
  托普斯2: {
    group: [
      { name: '托普斯分身', type: 'entity' },
      [
        { name: '知识渊博', type: 'knowledgeCard' },
        { name: '熊熊燃烧', type: 'knowledgeCard' },
      ],
    ],
    description: '托普斯分身无法继承知识渊博、熊熊燃烧等知识卡的效果。',
  },
  托普斯3: {
    group: [
      { name: '托普斯分身', type: 'entity' },
      { name: '猫虚弱', type: 'buff' },
    ],
    description: '3级托普斯分身无法转移老鼠夹与虚弱导致的控制效果。',
  },
  托普斯4: {
    group: [
      { name: '托普斯分身', type: 'entity' },
      { name: '格挡之剑', type: 'skill' },
    ],
    description: '格挡之剑的主动戳击无法命中托普斯分身，只有被动反击才能命中。',
  },
  托普斯5: {
    group: [
      { name: '捕虫网', type: 'skill' },
      [
        { name: '免控', type: 'buff' },
        { name: '霸体', type: 'buff' },
        { name: '绝对霸体', type: 'buff' },
      ],
    ],
    description: `捕虫网可以网住处于免控、霸体状态的老鼠。`,
    spacialCase: [
      {
        group: [
          { name: '捕虫网', type: 'skill' },
          { name: '降落伞', type: 'skill' },
        ],
        description: '捕虫网无法网住降落伞期间的罗宾汉杰瑞。',
      },
      {
        group: [
          { name: '捕虫网', type: 'skill' },
          { name: '格挡之剑', type: 'skill' },
        ],
        description: '捕虫网无法网住格挡期间的剑客杰瑞。',
      },
    ],
    excludeFactionId: 'cat',
  },
  托普斯6: {
    group: [
      { name: '捕虫网', type: 'skill' },
      { name: '鼠方变身效果', type: 'itemGroup' },
    ],
    description: `捕虫网无法网住变身期间的老鼠。`,
  },
  托普斯7: {
    group: [
      { name: '捕虫网', type: 'skill' },
      { name: '兔子先生', type: 'entity' },
    ],
    description: '捕虫网无法网住兔子先生。',
  },
  莱特宁1: {
    group: [
      { name: '瞬移闪击', type: 'skill' },
      { name: '牛仔吉他', type: 'skill' },
    ],
    description: `莱特宁使用3级瞬移闪击瞬移到正在弹奏吉他的牛仔杰瑞身后时，牛仔杰瑞会先眩晕，因此莱特宁不会陷入眩晕（除非牛仔杰瑞有霸体/护盾等效果）。`,
  },
  莱特宁2: {
    group: [
      [
        { name: '咸鱼', type: 'entity' },
        { name: '穷追不舍', type: 'skill' },
      ],
      [
        { name: '应急治疗', type: 'specialSkill', factionId: 'mouse' },
        { name: '牛仔吉他', type: 'skill' },
      ],
    ],
    description:
      '应急治疗和2级牛仔吉他可以解除咸鱼附加的腥味debuff，也可以解除1级穷追不舍附加的debuff。',
  },
  牛仔汤姆1: {
    group: [
      { name: '斗牛', type: 'entity' },
      [
        { name: '可破碎道具', type: 'itemGroup' },
        { name: '纸盒', type: 'itemGroup' },
        { name: '面粉袋', type: 'item' },
        { name: '仙人掌', type: 'itemGroup' },
      ],
    ],
    description:
      '斗牛可以破坏可破碎道具（{冰块}和{番茄}除外），以及纸盒、面粉袋、吊灯、牛仔杰瑞的仙人掌等。被破坏的可破碎道具会产生投掷命中墙壁/地面时的破碎效果，而纸盒、面粉袋、仙人掌会直接消失。',
  },
  牛仔汤姆2: {
    group: [
      { name: '斗牛', type: 'entity' },
      { name: '格挡之剑', type: 'skill' },
    ],
    description: '剑客杰瑞格挡期间，可以使碰撞自身的斗牛立即消失。',
  },
  牛仔汤姆3: {
    group: [
      { name: '斗牛', type: 'entity' },
      [
        { name: '方块', type: 'entity' },
        { name: '强化方块', type: 'entity' },
      ],
    ],
    description: '方块可以阻挡斗牛，使其折返。',
  },
  牛仔汤姆4: {
    group: [
      { name: '鞭子', type: 'skill' },
      [
        { name: '可破碎道具', type: 'itemGroup' },
        { name: '纸盒', type: 'itemGroup' },
        { name: '面粉袋', type: 'item' },
        { name: '仙人掌', type: 'itemGroup' },
      ],
    ],
    description:
      '鞭子可以破坏可破碎道具（{冰块}和{番茄}除外），以及纸盒、面粉袋、吊灯、牛仔杰瑞的仙人掌等。被破坏的可破碎道具会产生投掷命中墙壁/地面时的破碎效果，而纸盒、面粉袋、仙人掌会直接消失。',
  },
  牛仔汤姆5: {
    group: [
      { name: '说出你的故事', type: 'skill' },
      { name: '仙人掌弹弓', type: 'skill' },
    ],
    description:
      '牛仔汤姆位于米可采访范围内时，每射出1颗仙人掌球均会额外叠加1层素材（与其它素材叠加方式不冲突）。',
  },
  牛仔汤姆6: {
    group: [
      { name: '游刃有余', type: 'skill' },
      [
        { name: '兔子先生', type: 'entity' },
        { name: '侦探泰菲分身', type: 'entity' },
        { name: '饮料分身', type: 'entity' },
      ],
    ],
    description: '牛仔汤姆击倒部分NPC类衍生物也能触发2级游刃有余效果，如兔子先生，侦探泰菲分身等。',
  },
  牛仔汤姆7: {
    group: [
      { name: '游刃有余', type: 'skill' },
      [
        { name: '大星星', type: 'entity' },
        { name: '星星-敌方', type: 'entity' },
      ],
    ],
    description: '牛仔汤姆变身为大星星时，吐出的星星可以触发3级游刃有余的效果。',
  },
  图多盖洛1: {
    group: [
      { name: '飞吻', type: 'entity' },
      { name: '牛仔吉他', type: 'skill' },
    ],
    description: '2级牛仔吉他可以解除飞吻造成的吻痕效果。',
  },
  图多盖洛2: {
    group: [
      { name: '香水区域', type: 'entity' },
      { name: '干扰器', type: 'entity' },
    ],
    description: '2级干扰器生效期间可以暂时无视香水区域的负面效果。',
  },
  图多盖洛3: {
    group: [
      { name: '香水区域', type: 'entity' },
      [
        { name: '鞭炮', type: 'itemGroup' },
        { name: '火药桶', type: 'entity' },
        { name: '火箭筒', type: 'entity' },
      ],
    ],
    description:
      '爆炸带有受力效果，因此鞭炮、火药桶、火箭筒的爆炸效果可以将香水区域炸飞（沿直线飞出场外）。',
  },
  图多盖洛4: {
    group: [
      { name: '香水区域', type: 'entity' },
      [
        { name: '魔音穿耳', type: 'skill' },
        { name: '香风折扇', type: 'skill' },
        { name: '闪亮营救', type: 'skill' },
        { name: '勇往直前', type: 'skill' },
        { name: '滑步踢', type: 'skill' },
      ],
    ],
    description:
      '魔音穿耳、3级香风折扇、闪亮营救（满怒落地）、勇往直前、滑步踢的技能效果可以将香水区域弹飞（沿直线飞出场外）。',
  },
  图多盖洛5: {
    group: [
      { name: '魅力甲油', type: 'skill' },
      [
        { name: '击晕', type: 'knowledgeCard' },
        { name: '猛攻', type: 'knowledgeCard' },
        { name: '乘胜追击', type: 'knowledgeCard' },
      ],
    ],
    description: '[部分](具体生效范围待补充)与爪刀有关的知识卡、特技能对甲油额外爪击区域生效。',
  },
  侍卫汤姆1: {
    group: [
      { name: '警戒', type: 'skill' },
      { name: '远视饮料', type: 'item' },
    ],
    description: '警戒能清除由远视饮料提供的远视。',
  },
  侍卫汤姆2: {
    group: [
      { name: '警戒', type: 'skill' },
      { name: '必备专业素养', type: 'skill' },
    ],
    description: '警戒无法清除部分永久类远视效果，包括：必备专业素养提供的远视。',
  },
  侍卫汤姆3: {
    group: [
      { name: '警戒', type: 'skill' },
      [
        { name: '隐身饮料', type: 'item' },
        { name: '隐身', type: 'skill' },
        { name: '分身大师', type: 'skill' },
        { name: '星星', type: 'entity' },
        { name: '魔咒强身', type: 'skill' },
      ],
    ],
    description:
      '警戒能清除大部分隐身效果，包括：隐身饮料、太空堡垒科研舱、部分技能（隐身、分身大师、星星（1星）、2级魔咒强身）提供的隐身。',
  },
  侍卫汤姆4: {
    group: [
      { name: '警戒', type: 'skill' },
      [
        { name: '护盾', type: 'buff' },
        { name: '无敌', type: 'buff' },
      ],
    ],
    description: '警戒能清除大部分护盾效果，以及有"护盾"特效的无敌效果。',
    spacialCase: [
      {
        group: [
          { name: '警戒', type: 'skill' },
          [
            { name: '恶魔之门', type: 'entity' },
            { name: '野生体格', type: 'skill' },
          ],
        ],
        description: '警戒无法清除由2级野生体格或恶魔之门（友方使用时）提供的护盾。',
      },
    ],
    excludeFactionId: 'cat',
  },
  侍卫汤姆5: {
    group: [
      { name: '警戒', type: 'skill' },
      { name: '兴奋饮料', type: 'item' },
    ],
    description: '警戒能清除由兴奋饮料提供的兴奋效果。',
  },
  侍卫汤姆6: {
    group: [
      { name: '警戒', type: 'skill' },
      { name: '比利鼠', type: 'entity' },
    ],
    description: '警戒能清除所有比利鼠变身效果。',
  },
  侍卫汤姆7: {
    group: [
      { name: '警戒', type: 'skill' },
      { name: '超级变！变！变！', type: 'skill' },
    ],
    description: '警戒会直接解除米雪儿的变身效果。',
  },
  侍卫汤姆8: {
    group: [
      { name: '警戒', type: 'skill' },
      { name: '降落伞', type: 'skill' },
    ],
    description: '降落伞降落期间不会被警戒影响。',
  },
  侍卫汤姆9: {
    group: [
      { name: '炮弹', type: 'entity' },
      { name: '远视饮料', type: 'item' },
    ],
    description: '炮弹命中敌方时，会清除由远视饮料提供的远视。',
  },
  侍卫汤姆10: {
    group: [
      { name: '炮弹', type: 'entity' },
      { name: '隐身', type: 'buff' },
    ],
    description:
      '炮弹命中敌方时，会清除大部分隐身效果，包括：隐身饮料、太空堡垒科研舱、部分技能（隐身、分身大师、星星（1星）、2级魔咒强身）提供的隐身。',
    spacialCase: [
      {
        group: [
          { name: '炮弹', type: 'entity' },
          { name: '黄色卡牌', type: 'entity' },
        ],
        description: '炮弹命中不会清除由3级的黄色卡牌提供的隐身。',
      },
      {
        group: [
          { name: '炮弹', type: 'entity' },
          { name: '灵活跳跃', type: 'skill' },
        ],
        description: '炮弹命中不会清由3级灵活跳跃提供的隐身。',
      },
    ],
    excludeFactionId: 'cat',
  },
  侍卫汤姆11: {
    group: [
      { name: '炮弹', type: 'entity' },
      { name: '兴奋饮料', type: 'item' },
    ],
    description: '炮弹命中敌方时，会清除由兴奋饮料提供的兴奋效果。',
  },
  米特1: {
    group: [
      { name: '胡椒粉罐头', type: 'entity' },
      { name: '鼠虚弱', type: 'buff' },
      [
        { name: '无畏', type: 'knowledgeCard' },
        { name: '舍己', type: 'knowledgeCard' },
      ],
    ],
    description:
      '胡椒粉罐头导致的持续伤害不会因进入虚弱状态或被抓起而清除，此时老鼠可能因被抓起后再次受到伤害而在猫手中或火箭上进入虚弱状态。火箭上的老鼠在虚弱持续期间被救下时，仍会继续处于虚弱状态，且无畏和舍己无法令其获得护盾或恢复Hp。',
  },
  塔拉1: {
    group: [
      { name: '西部情谊', type: 'skill' },
      { name: '乾坤袋(NPC)', type: 'entity' },
    ],
    description: '西部情谊无法命中乾坤袋。',
  },
  塔拉2: {
    group: [
      { name: '牛仔鞭索', type: 'skill' },
      { name: '拳套盒', type: 'item' },
    ],
    description:
      '被塔拉抓住并通过牛仔鞭索丢出的老鼠，碰到拳套盒时会停止飞行（与碰到墙壁的效果类似）。',
  },
  塔拉3: {
    group: [
      { name: '牛仔鞭索', type: 'skill' },
      [
        { name: '鞭炮', type: 'itemGroup' },
        { name: '电风扇', type: 'item' },
      ],
    ],
    description:
      '被塔拉抓住并通过牛仔鞭索丢出的老鼠，因部分原因（如鞭炮爆炸，电风扇吹风，经典之家轮胎命中）导致受力时，不会停止飞行，但可能改变运动方向。',
  },
  塔拉4: {
    group: [
      { name: '套索', type: 'entity' },
      [
        { name: '铁血', type: 'knowledgeCard' },
        { name: '喜剧之王', type: 'skill' },
      ],
    ],
    description: '老鼠因2级套索伤害而进入铁血或1级喜剧之王的状态时，仍会受到后续眩晕。',
  },
  塔拉5: {
    group: [
      { name: '套索', type: 'entity' },
      { name: '机器鼠', type: 'entity' },
    ],
    description:
      '套索可以命中机器鼠，会将其套中（塔拉可释放二段技能飞向对方），但无法将其打爆，且机器鼠免疫套索的控制效果。',
  },
  塔拉6: {
    group: [
      { name: '心思缜密', type: 'skill' },
      { name: '远视饮料', type: 'item' },
    ],
    description: '2级心思缜密生效期间会移除其它大部分远视效果。',
  },
  塔拉7: {
    group: [
      { name: '心思缜密', type: 'skill' },
      { name: '乾坤袋(NPC)', type: 'entity' },
    ],
    description: '命中乾坤袋也可以触发3级心思缜密的效果。',
  },
  剑客汤姆1: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      { name: '泰菲类角色', type: 'itemGroup' },
    ],
    description:
      '泰菲类角色体型比正常角色小一些，所以剑客汤姆与他们处于同一平台时，骑士连斩第三段会因碰撞到平台/地面而连斩失败。剑客汤姆可通过[高低差](剑客汤姆在下方，泰菲在上方)或在泰菲因第二段挑飞而未落地前进行连斩，以避免这种情况。',
  },
  剑客汤姆2: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      { name: '拳套盒', type: 'item' },
    ],
    description: '骑士连斩第三段会被拳套盒阻挡，导致释放失败（与碰撞到墙壁的效果类似）。',
  },
  剑客汤姆3: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      { name: '鼠虚弱', type: 'buff' },
    ],
    description: `骑士连斩冲刺命中虚弱老鼠能解锁第二段，且能无视虚弱将其挑飞并连斩。`,
  },
  剑客汤姆4: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      { name: '护盾', type: 'buff' },
    ],
    description: `骑士连斩冲刺命中持有护盾的老鼠能解锁第二段，且能无视护盾将其挑飞并连斩，连斩伤害无视护盾直接对角色本身造成伤害，若角色因此虚弱则消耗1层护盾免疫此次虚弱。`,
    excludeFactionId: 'cat',
  },
  剑客汤姆5: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      { name: '无敌', type: 'buff' },
    ],
    description: `骑士连斩冲刺命中无敌期间的老鼠无法解锁第二段，但可借助命中其它目标解锁的二段技能将其挑飞，连斩伤害无视无敌直接对角色本身造成伤害，但无敌持续期间角色不会因此虚弱。`,
    spacialCase: [
      {
        group: [
          { name: '骑士连斩', type: 'skill' },
          { name: '冰冻保鲜', type: 'specialSkill' },
        ],
        description: `骑士连斩冲刺命中冰冻保鲜期间的老鼠能解锁第二段，但无法将其挑飞。`,
      },
    ],
    excludeFactionId: 'cat',
  },
  剑客汤姆6: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      [
        { name: '免控', type: 'buff' },
        { name: '霸体', type: 'buff' },
        { name: '绝对霸体', type: 'buff' },
      ],
    ],
    description: `骑士连斩冲刺命中持有霸体的老鼠能解锁第二段，但无法将其挑飞。`,
    excludeFactionId: 'cat',
  },
  剑客汤姆7: {
    group: [
      { name: '骑士连斩', type: 'skill' },
      { name: '鼠方变身效果', type: 'itemGroup' },
    ],
    description: `骑士连斩冲刺命中变身期间的老鼠能解锁第二段，但无法将其挑飞。`,
  },
  剑客汤姆8: {
    group: [
      { name: '剑盾防御', type: 'skill' },
      { name: '远视饮料', type: 'item' },
    ],
    description: '剑盾防御生效期间会移除其它大部分远视效果。',
  },
  剑客汤姆9: {
    group: [
      { name: '旋刃剑舞', type: 'skill' },
      [
        { name: '免控相关效果', type: 'itemGroup' },
        { name: '捣蛋鬼', type: 'skill' },
        { name: '超级变！变！变！', type: 'skill' },
        { name: '香甜梦境', type: 'skill' },
      ],
    ],
    description: `旋刃剑舞第一段无法被任何状态免疫。`,
    excludeFactionId: 'cat',
  },
  库博1: {
    group: [
      { name: '虚幻梦影', type: 'skill' },
      { name: '遥控器', type: 'item' },
    ],
    description: '虚幻梦影隐身期间依然会被遥控器召唤的机器鼠索敌和控制。',
  },
  库博2: {
    group: [
      { name: '虚幻梦影', type: 'skill' },
      { name: '暗中观察', type: 'skill' },
    ],
    description: '隐身的侦探泰菲能通过1级暗中观察的效果看到处于虚幻梦影隐身期间的库博。',
  },
  库博3: {
    group: [
      { name: '虚幻梦影', type: 'skill' },
      [
        { name: '贵族礼仪', type: 'skill' },
        { name: '梦幻舞步', type: 'skill' },
      ],
    ],
    description: '虚幻梦影提供的隐身状态不会被贵族礼仪或梦幻舞步清除。',
  },
  库博4: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '老鼠夹', type: 'item' },
    ],
    description:
      '救援天堂火箭上的老鼠时，若火箭下方有夹子则必定会踩夹，无法"跳救"。这是因为天堂火箭的救援位置与普通火箭不同。',
  },
  库博5: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '兔子先生', type: 'skill' },
    ],
    description: '魔术师无法对天堂火箭下达救援指令。',
  },
  库博6: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '兔子大表哥', type: 'skill' },
    ],
    description: '魔术师无法对天堂火箭下达举火箭指令。',
  },
  库博7: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '机器鼠', type: 'entity' },
    ],
    description: '钻入机器鼠中的老鼠依然会因天堂火箭效果而被放飞。',
  },
  库博8: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '乾坤袋(NPC)', type: 'entity' },
    ],
    description: '与乾坤袋融合的老鼠暂时不会因天堂火箭效果而被放飞，但在解除该状态的瞬间会被放飞。',
  },
  库博9: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '火箭', type: 'item' },
      { name: '喜剧之王', type: 'skill' },
    ],
    description:
      '表演者•杰瑞因天堂火箭倒计时归零而被放飞时，若自身同时被绑在普通火箭上，则会正常触发3级喜剧之王的复活效果；若自身没有被绑在普通火箭上，则会被直接放飞，无法触发3级喜剧之王的复活效果。',
  },
  库博10: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '天使祝福', type: 'skill' },
    ],
    description:
      '天使祝福无法祝福被绑在天堂火箭上的老鼠虚影，也无法复活因天堂火箭倒计时归零而被放飞的老鼠。',
  },
  库博11: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '火箭', type: 'item' },
      { name: '鼓舞', type: 'skill' },
    ],
    description:
      '3级鼓舞的增加火箭读秒效果对普通火箭和天堂火箭分别生效，对角色和虚影分别生效，可叠加。例：杰瑞对被同时绑上天堂和普通火箭的罗宾汉杰瑞进行鼓舞，则地面和天堂火箭的读秒均增加；杰瑞同时鼓舞自身和被绑在天堂火箭上的自己的虚影，则天堂火箭增加双倍读秒。',
  },
  库博12: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      [
        { name: '身体素质', type: 'skill' },
        { name: '心灵手巧', type: 'knowledgeCard' },
        { name: '闪耀足球', type: 'entity' },
        { name: '三角', type: 'entity' },
        { name: '强化三角', type: 'entity' },
      ],
    ],
    description: '绑上天堂火箭所需的时间固定，不受绑火箭加/减速影响（包括自身的2级被动）。',
  },
  库博13: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      [
        { name: '加大火力', type: 'knowledgeCard' },
        { name: '熊熊燃烧', type: 'knowledgeCard' },
        { name: '友情庇护', type: 'skill' },
        { name: '侠义相助', type: 'skill' },
        { name: '风格骤变', type: 'skill' },
        { name: '蓝图', type: 'entity' },
        { name: '梦中乐园', type: 'skill' },
      ],
    ],
    description: '天堂火箭的燃烧速度固定，同时免受部分改变引线长度效果的影响。',
  },
  库博14: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      [
        { name: '火药桶', type: 'entity' },
        { name: '共鸣', type: 'skill' },
      ],
    ],
    description: '天堂火箭无法被炸毁。',
  },
  库博15: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      [
        { name: '花洒', type: 'entity' },
        { name: '沙包拳头', type: 'skill' },
        { name: '滑步踢', type: 'skill' },
        { name: '乾坤袋(NPC)', type: 'entity' },
      ],
    ],
    description: '天堂火箭无法熄灭，也不会移动。',
  },
  库博16: {
    group: [
      { name: '天堂火箭', type: 'entity' },
      { name: '穷追猛打', type: 'knowledgeCard' },
    ],
    description: '绑上天堂火箭也会导致穷追猛打失效。',
  },
  尼宝1: {
    group: [
      [
        { name: '尼宝的朋友', type: 'entity' },
        { name: '鱼钩', type: 'entity' },
      ],
      { name: '免控相关效果', type: 'itemGroup' },
    ],
    description: '鱼钩的控制和掉落老鼠的效果无视绝大多数的护盾、无敌、霸体等效果。',
    spacialCase: [
      {
        group: [
          { name: '发怒冲刺', type: 'skill' },
          [
            { name: '尼宝的朋友', type: 'entity' },
            { name: '鱼钩', type: 'entity' },
          ],
        ],
        description: '发怒冲刺[生效](不包括前摇)期间依然会被鱼钩牵引，但不会掉落手中老鼠。',
      },
    ],
    excludeFactionId: 'mouse',
  },
  仙女鼠1: {
    group: [
      [
        { name: '星星', type: 'entity' },
        { name: '大星星', type: 'entity' },
      ],
      [
        { name: '护盾', type: 'buff' },
        { name: '无敌', type: 'buff' },
      ],
    ],
    description: '护盾效果无法免疫星星的伤害或变身效果。',
    spacialCase: [
      {
        group: [
          [
            { name: '星星', type: 'entity' },
            { name: '大星星', type: 'entity' },
          ],
          { name: '发怒冲刺', type: 'skill' },
        ],
        description: '发怒冲刺期间不会变身为大星星，但仍会受到被1/2/4/6星命中导致的伤害。',
      },
      {
        group: [
          [
            { name: '星星', type: 'entity' },
            { name: '大星星', type: 'entity' },
          ],
          { name: '狂欢时刻', type: 'skill' },
        ],
        description: '狂欢时刻期间不会变身为大星星，但仍会受到被1/2/4/6星命中导致的伤害。',
      },
    ],
    excludeFactionId: 'mouse',
  },
  其它特性1: {
    group: [
      { name: '灰花瓶', type: 'item' },
      { name: '蓝花瓶', type: 'item' },
      { name: '冰块', type: 'item' },
      { name: '小鞭炮', type: 'item' },
      { name: '鞭炮束', type: 'item' },
      { name: '狗骨头', type: 'item' },
      { name: '长枪', type: 'entity' },
      { name: '沙包拳头', type: 'skill' },
    ],
    description:
      '此类道具/技能造成的眩晕无法共存，角色处于由这些来源导致的眩晕时，免疫其它来自这些来源的眩晕。（注："长枪"指2级长枪蓄力超过2/3但未到最大值时的眩晕，"沙包拳头"指游龙拳击退撞到道具导致的额外眩晕）',
  },
  //------------------以下特性采用录入时间命名------------------/
  '20251207-01': {
    description: '米雪儿可以变身为绿色小淘气，但被恶魔泰菲投掷命中时会消耗恶魔泰菲的3级被动。',
    group: [
      { name: '超级变！变！变！', type: 'skill' },
      { name: '黑暗印记', type: 'skill' },
      { name: '绿色小淘气', type: 'entity' },
    ],
  },
  '20251207-02': {
    description: '瑜伽球的伤害和控制不会触发恶魔杰瑞3级被动，亦无法被其免疫。',
    group: [{ name: '瑜伽球', type: 'entity' }, [{ name: '捣蛋鬼', type: 'skill' }]],
  },
};

export default traits;
