/* eslint-disable */
// @ts-nocheck
// 模板文件 - 用于贡献者填写角色数据，不需要类型检查
// 如果编辑器提示类型错误，可以忽略，这是正常的

// 定义角色数据类型（仅用于模板说明）
interface CharacterDefinition {
  [key: string]: any;
}

const catCharacterDefinitions: Record<string, CharacterDefinition> = {
  /* ----------------------------------- 汤姆 ----------------------------------- */
  // 角色名
  汤姆: {
    description: '全能男神汤姆，除了抓老鼠以外什么都会，杰瑞的欢喜冤家', // 角色描述，可参考游戏中的描述

    maxHp: 255, // 健康值上限
    attackBoost: 0, // 攻击增伤，没有则填0
    hpRecovery: 3.5, // 健康值回复速度
    moveSpeed: 760, // 移速
    jumpHeight: 420, // 跳跃高度（猫为420，鼠参差不齐）
    clawKnifeCdHit: 4.5, // 爪刀命中时的冷却时间（猫咪专用）
    clawKnifeCdUnhit: 2.3, // 爪刀未命中时的冷却时间（猫咪专用）
    clawKnifeRange: 300, // 爪刀攻击范围（猫咪专用）

    catPositioningTags: [
      // 定位标签
      {
        tagName: '进攻', // 定位标签名
        isMinor: false, // 是否为次要定位
        description: '主动技能的无敌有很强的上火箭能力。', // 定位描述
        additionalDescription: '二被+锅 或者 枪+蓄力重击 也能对守火箭的老鼠产生极大威胁。', // 补充描述
      },
      {
        tagName: '打架',
        isMinor: false,
        description: '无敌提供解控，一被提供续航。',
        additionalDescription: '对打架阵容有很强的反制能力。',
      },
      {
        tagName: '翻盘',
        isMinor: true, // 次要定位，所以设为true
        description: '武器技能的直接抓取提供了一定的翻盘能力',
        additionalDescription: '', // 空字符串表示无额外描述
      },
    ],

    skillAllocations: [
      // 技能加点方案
      {
        id: '手型枪', // 武器名称
        pattern: '121220001', // 加点序列
        weaponType: 'weapon1', // 武器类型：weapon1或weapon2
        description: '', // 加点说明
        additionaldescription: '', // 额外说明
      },
      {
        id: '平底锅',
        pattern: '131[3300]01', // 中括号表示平行加点，需要根据实际情况抉择加点顺序是3300还是0033；小括号表示需要留加点（莉莉、罗菲二被）、减号表示一般不升这级（苏蕊三级跳舞），示例：01(0)1[10]22-2
        weaponType: 'weapon2',
        description: '非常顺风的时候可以考虑先点被动再点锅。',
        additionaldescription: '如果血量告急，也可以考虑先点一被回血。',
      },
    ],

    knowledgeCardGroups: [
      // 知识卡组合推荐
      ['S-愤怒', 'S-舍己', 'S-回家', 'C-不屈', 'C-跳舞'],
      ['S-愤怒', 'S-大力', 'A-钳制', 'C-飞镖', 'C-不屈'],
    ],

    skills: [
      // 技能列表
      {
        name: '九死一生', // 技能名
        type: 'active', // 技能类型：active（主动）或passive（被动）
        description: '短暂获得无敌状态，无敌结束后恢复健康值。', // 技能描述
        detailedDescription: '获得1.5秒的无敌状态，无敌结束后恢复30/45/60点健康值。', // 详细描述
        canMoveWhileUsing: true, // 使用技能时是否能移动
        weaponType: 'weapon1', // 武器类型：weapon1、weapon2或none
        cd: 30, // 冷却时间（秒）
        levelParams: [
          // 各等级参数
          {
            level: 1, // 等级
            cd: 30, // 冷却时间
            description: '获得1.5秒的无敌状态，无敌结束后恢复30点健康值。', // 该等级描述
            detailedDescription: '获得1.5秒的无敌状态，无敌结束后恢复30点健康值。',
          },
          {
            level: 2,
            cd: 30,
            description: '获得1.5秒的无敌状态，无敌结束后恢复45点健康值。',
            detailedDescription: '获得1.5秒的无敌状态，无敌结束后恢复45点健康值。',
          },
          {
            level: 3,
            cd: 30,
            description: '获得1.5秒的无敌状态，无敌结束后恢复60点健康值。',
            detailedDescription: '获得1.5秒的无敌状态，无敌结束后恢复60点健康值。',
          },
        ],
      },
      {
        name: '健康回复',
        type: 'passive',
        description: '持续恢复健康值。',
        detailedDescription: '每3秒恢复8/12/16点健康值。',
        canMoveWhileUsing: true,
        weaponType: 'none',
        cd: 0,
        levelParams: [
          {
            level: 1,
            cd: 0,
            description: '每3秒恢复8点健康值。',
            detailedDescription: '每3秒恢复8点健康值。',
          },
          {
            level: 2,
            cd: 0,
            description: '每3秒恢复12点健康值。',
            detailedDescription: '每3秒恢复12点健康值。',
          },
          {
            level: 3,
            cd: 0,
            description: '每3秒恢复16点健康值。',
            detailedDescription: '每3秒恢复16点健康值。',
          },
        ],
      },
      {
        name: '蓄力重击',
        type: 'active',
        description: '蓄力后发动重击，对前方敌人造成伤害并击晕。',
        detailedDescription:
          '蓄力1.5秒后发动重击，对前方300范围内的敌人造成30/40/50点伤害并击晕1.5秒。',
        canMoveWhileUsing: false,
        weaponType: 'weapon2',
        cd: 15,
        levelParams: [
          {
            level: 1,
            cd: 15,
            description: '蓄力1.5秒后发动重击，对前方300范围内的敌人造成30点伤害并击晕1.5秒。',
            detailedDescription:
              '蓄力1.5秒后发动重击，对前方300范围内的敌人造成30点伤害并击晕1.5秒。',
          },
          {
            level: 2,
            cd: 15,
            description: '蓄力1.5秒后发动重击，对前方300范围内的敌人造成40点伤害并击晕1.5秒。',
            detailedDescription:
              '蓄力1.5秒后发动重击，对前方300范围内的敌人造成40点伤害并击晕1.5秒。',
          },
          {
            level: 3,
            cd: 15,
            description: '蓄力1.5秒后发动重击，对前方300范围内的敌人造成50点伤害并击晕1.5秒。',
            detailedDescription:
              '蓄力1.5秒后发动重击，对前方300范围内的敌人造成50点伤害并击晕1.5秒。',
          },
        ],
      },
      {
        name: '钓鱼',
        type: 'passive',
        description: '钓鱼被动技能。',
        detailedDescription: '钓鱼被动技能详细描述。',
        canMoveWhileUsing: true,
        weaponType: 'none',
        cd: 0,
        levelParams: [
          {
            level: 1,
            cd: 0,
            description: '钓鱼被动技能描述。',
            detailedDescription: '钓鱼被动技能详细描述。',
          },
        ],
      },
    ],
  },
};

// 导出供参考（模板使用）
export default catCharacterDefinitions;
