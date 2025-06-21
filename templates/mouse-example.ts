/* eslint-disable */
// @ts-nocheck
// 模板文件 - 用于贡献者填写角色数据，不需要类型检查
// 如果编辑器提示类型错误，可以忽略

//（别动）
interface CharacterDefinition {
  [key: string]: any;
}

const mouseCharacterDefinitions: Record<string, CharacterDefinition> = {
  /* ----------------------------------- 杰瑞 ----------------------------------- */
  // 角色名
  杰瑞: {
    description: '古灵精怪的小老鼠，喜欢戏弄汤姆，汤姆的欢喜冤家', // 角色描述，可参考游戏中的描述

    maxHp: 99, // 健康值上限（这些属性可参考鼠数值.xlsx）
    attackBoost: 15, // 攻击增伤
    hpRecovery: 2, // 健康值回复速度
    moveSpeed: 650, // 移速
    jumpHeight: 400, // 跳跃高度（380~420）
    cheesePushSpeed: 4, // 推奶酪速度（前三分钟的数值，即基础推速×0.8）
    wallCrackDamageBoost: 1, // 墙缝增伤
    mousePositioningTags: [
      // 定位
      {
        tagName: '奶酪', // 标签名
        isMinor: false, // 是否为次要定位
        description: '推速快。', // 定位描述
        additionalDescription: '此外还有被动提供推速加成和搬奶酪速度。', // 补充描述
      },
      {
        tagName: '辅助',
        isMinor: true, // 次要定位，所以设为true
        description: '鼓舞为队友提供增益、处理二手火箭；鸟哨限制猫的走位。',
        additionalDescription: '', // 留空表示无额外描述
      },
    ],

    skillAllocations: [
      // 技能加点方案
      {
        id: '大铁锤', // 武器名称，没有二武可以留白
        pattern: '0[12]112200', // 加点序列，0123分别表示被动、主动、一武、二武。中括号表示平行加点，需要根据实际情况抉择加点顺序是12还是21；小括号表示需要留加点（莉莉、罗菲二被）；减号表示一般不升这级（苏蕊三级跳舞），示例：01(0)1[10]22-2
        weaponType: 'weapon1', // 武器类型：weapon1或weapon2
        description: '加点灵活，如需自保则开局优先一级鼓舞；需要搬奶酪则四级优先二被。', // 加点说明
        additionaldescription: '', // 补充描述
      },
      {
        id: '鸟哨',
        pattern: '0[13]113300',
        weaponType: 'weapon2',
        description: '加点灵活，如需自保则开局优先一级鼓舞；需要搬奶酪则四级优先二被。',
        additionaldescription: '',
      },
    ],

    knowledgeCardGroups: [
      ['S-铁血', 'S-护佑', 'S-回家', 'C-救救我'],
      ['S-铁血', 'S-舍己', 'A-逃窜', 'C-不屈', 'C-救救我'],
    ],

    skills: [
      {
        name: '鼓舞', // 技能名
        type: 'active', // 技能类型：active（主动），weapon1（一武），weapon2（二武），passive（被动）
        description: '短暂为自己和附近队友提供增益。', // 技能描述。填写三个等级共有的效果。
        // detailedDescription: '短暂为自己和附近队友提供增益。', // 详细描述，没有可以删除或设为与技能描述相同，但不要留白
        canMoveWhileUsing: true, // 使用技能时是否能移动
        canUseInAir: true, // 是否能在空中使用技能
        cancelableSkill: '不可被打断', // 技能前摇时是否可被打断，填写“无前摇”，“不可被打断”或“可被...打断”
        cancelableAftercast: '不可取消后摇', // 技能后摇是否可取消，填写“无后摇”，“不可被打断”或“可被...打断”
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=66.5', // （可选）视频链接，后面的?t=...表示视频开始播放的时间点，单位为秒，例如此处对应1分6.5秒
        skillLevels: [
          {
            level: 1, // 技能等级
            description: '鼓舞增加移速和跳跃高度。', // 该等级的技能描述。一级技能的描述可以留空
            detailedDescription: '鼓舞增加15%移速和45%跳跃高度，持续5秒。', // 详细描述，没有可以删除或设为与技能描述相同，但不要留白
            cooldown: 18, // 冷却时间
          },
          {
            level: 2,
            description: '鼓舞额外回复25Hp。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '鼓舞额外解除受伤状态，并延长附近绑有老鼠的火箭10秒燃烧时间。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '大铁锤',
        type: 'weapon1',
        description: '举起大铁锤近身攻击。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断', //事实上，如果技能释放时和点道具键时有同一个道具可拾取，那么这样短距离的移动释放也能取消后摇
        cancelableAftercast: '不可取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=104.4',
        skillLevels: [
          {
            level: 1,
            description: '眩晕猫咪3秒。',
            cooldown: 20,
          },
          {
            level: 2,
            description: '额外造成65伤害；每次命中永久增加10%推速，最多叠五层。',
            cooldown: 16,
          },
          {
            level: 3,
            description: '眩晕时间延长至4秒。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '鸟哨',
        type: 'weapon2',
        description: '召唤投掷炸弹的金丝雀。',
        detailedDescription:
          '召唤投掷炸弹的金丝雀。同一房间内最多只能有一只投掷炸弹的金丝雀。猫咪被金丝雀的炸弹命中后将对其短暂免疫。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被道具键*打断',
        cancelableAftercast: '可被道具键*取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=125.5',
        skillLevels: [
          {
            level: 1,
            description: '炸弹造成55伤害和2秒眩晕。',
            detailedDescription: '炸弹造成55伤害和2秒眩晕；总共释放约15个炸弹。',
            cooldown: 30,
          },
          {
            level: 2,
            description: '提高金丝雀投掷炸弹的频率。',
            detailedDescription: '提高金丝雀投掷炸弹的频率，炸弹数量提升到约17个。',
            cooldown: 30,
          },
          {
            level: 3,
            description: '减少CD；进一步提高金丝雀投掷炸弹的频率。',
            detailedDescription: '减少CD；进一步提高金丝雀投掷炸弹的频率，炸弹数量提升到约20个。',
            cooldown: 24,
          },
        ],
      },
      {
        name: '奶酪好手',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV14F4m1u7rg?t=36',
        skillLevels: [
          {
            level: 1,
            description: '增加推速。',
            detailedDescription: '增加20%推速',
          },
          {
            level: 2,
            description: '搬奶酪时，增加移速和跳跃高度。',
            detailedDescription: '搬奶酪时，移速增加52%、跳跃高度增加25%。',
          },
          {
            level: 3,
            description: '奶酪被推完或墙缝被破坏到一定程度时，解除虚弱和受伤，并回复少量Hp。',
            detailedDescription:
              '奶酪被推完或墙缝被破坏到80%、60%、40%、20%、0%时，解除虚弱和受伤、回复20Hp、并获得2.7秒的13%加速。',
          },
        ],
      },
    ],
  },
};

//（别动）
export default mouseCharacterDefinitions;
