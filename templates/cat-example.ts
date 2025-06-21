/* eslint-disable */
// @ts-nocheck
// 模板文件 - 用于贡献者填写角色数据，不需要类型检查
// 如果编辑器提示类型错误，可以忽略

// （别动）
interface CharacterDefinition {
  [key: string]: any;
}

const catCharacterDefinitions: Record<string, CharacterDefinition> = {
  /* ----------------------------------- 汤姆 ----------------------------------- */
  // 角色名
  汤姆: {
    description: '全能男神汤姆，除了抓老鼠以外什么都会，杰瑞的欢喜冤家', // 角色描述，可参考游戏中的描述

    maxHp: 255, // 健康值上限
    attackBoost: 0, // （可选）攻击增伤，没有则填0或删除这行
    hpRecovery: 3.5, // 健康值回复速度
    moveSpeed: 760, // 移速，参考 我在猫鼠学物理1.0
    jumpHeight: 420, // 跳跃高度（猫均为420，不用动）
    clawKnifeCdHit: 4.5, // 爪刀命中时的冷却时间
    clawKnifeCdUnhit: 2.3, // 爪刀未命中时的冷却时间
    clawKnifeRange: 300, // 爪刀范围

    catPositioningTags: [
      // 定位
      {
        tagName: '进攻', // 标签名
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
        additionalDescription: '', // 留空表示无额外描述
      },
    ],

    skillAllocations: [
      // 技能加点方案
      {
        id: '手型枪', // 武器名称，没有二武可以留白
        pattern: '121220001', // 加点序列
        weaponType: 'weapon1', // 武器类型：weapon1或weapon2
        description: '', // 加点说明
        additionaldescription: '', // 补充描述
      },
      {
        id: '平底锅',
        pattern: '131[3300]01', // 中括号表示平行加点，需要根据实际情况抉择加点顺序是3300还是0033；小括号表示需要留加点（莉莉、罗菲二被）；减号表示一般不升这级（苏蕊三级跳舞），示例：01(0)1[10]22-2
        weaponType: 'weapon2',
        description: '非常顺风的时候可以考虑先点被动再点锅。',
        additionaldescription: '如果血量告急，也可以考虑先点一被回血。',
      },
    ],

    knowledgeCardGroups: [
      // 知识卡组合推荐
      ['S-乘胜追击', 'S-击晕', 'A-熊熊燃烧'],
      ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'A-心灵手巧'],
      ['S-乘胜追击', 'A-熊熊燃烧', 'A-穷追猛打', 'C-猫是液体', 'C-狡诈'],
    ],

    skills: [
      // 技能列表
      {
        name: '发怒冲刺', // 技能名
        type: 'active', // 技能类型：active（主动），weapon1（一武），weapon2（二武），passive（被动）
        description: '解控并进入一段时间的无敌。', // 技能描述。填写三个等级共有的效果。
        detailedDescription:
          '解控并进入一段时间的无敌，前摇期间为弱霸体，且会被冰水打断。无敌期间获得12.5%加速，仍会受到真实伤害（如仙女鼠的一星；但不会因此被击倒）和位移效果的影响（如尼宝的钩子）。若在莱恩蓝图内受到真实伤害，不免疫变线条猫。交互（如绑火箭）会被仙女鼠八星打断。无敌结束后会有2秒的10%减速（可以被护盾抵消）。', // 详细描述，没有可以删除或设为与技能描述相同，但不要留白
        canMoveWhileUsing: true, // 使用技能时是否能移动
        canUseInAir: true, // 是否能在空中使用技能
        cancelableSkill: '可被道具键打断，但不返还CD', // 技能前摇时是否可被打断，填写“无前摇”，“不可被打断”或“可被...打断”
        cancelableAftercast: '无后摇', // 技能后摇是否可取消，填写“无后摇”，“不可被打断”或“可被...打断”
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=127.35', // （可选）视频链接，后面的?t=...表示视频开始播放的时间点，单位为秒，例如此处对应2分7.35秒
        skillLevels: [
          {
            level: 1, // 技能等级
            description: '无敌持续3.8秒。', // 该等级的技能描述。一级技能的描述可以留空
            cooldown: 20, // 冷却时间
          },
          {
            level: 2,
            description: '无敌持续6.8秒。',
            cooldown: 20,
          },
          {
            level: 3,
            description: '无敌期间减少爪刀CD。',
            detailedDescription: '无敌期间减少25%爪刀CD。', // 详细描述，没有可以删除或设为与技能描述相同，但不要留白
            cooldown: 20,
          },
        ],
      },
      {
        name: '手型枪',
        type: 'weapon1',
        description: '汤姆最爱的捕鼠神器。',
        canMoveWhileUsing: false,
        canUseInAir: true,
        cancelableSkill: '可被跳跃键打断',
        cancelableAftercast: '可被跳跃键取消后摇',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=16',
        skillLevels: [
          {
            level: 1,
            description: '手型枪水平飞出、飞回，对命中的老鼠造成少量伤害、将其抓回并眩晕。',
            detailedDescription:
              '手型枪水平飞出、原路飞回，对命中的老鼠造成15点伤害、将其抓回并眩晕2.5秒。如果拉回过程遇到障碍，额外给予65点伤害。眩晕对比例鼠和虚弱的老鼠也生效。',
            cooldown: 12,
          },
          {
            level: 2,
            description: '手型枪飞行速度增加。',
            cooldown: 12,
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被手型枪拉回并眩晕的老鼠。',
            cooldown: 12,
          },
        ],
      },
      {
        name: '平底锅',
        type: 'weapon2',
        description: '挥锅攻击老鼠并打出煎蛋。',
        canMoveWhileUsing: true,
        canUseInAir: true,
        cancelableSkill: '可被道具键打断',
        cancelableAftercast: '可被道具键取消后摽',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=172.85',
        skillLevels: [
          {
            level: 1,
            description: '打晕并致盲附近老鼠、降低其救援速度；也能击飞道具。',
            detailedDescription:
              '挥锅对命中的老鼠造成15点伤害、5秒失明和55%救援减速；煎蛋也会对命中的老鼠造成15点伤害、5秒失明和55%救援减速；被锅命中的老鼠落地后受到25点伤害，并眩晕1秒。',
            cooldown: 18,
          },
          {
            level: 2,
            description: '失明延长至7.5秒；锅命中老鼠刷新爪刀CD。',
            cooldown: 18,
          },
          {
            level: 3,
            description: '猫咪可以直接抓起被平底锅命中、落地后眩晕的老鼠。',
            cooldown: 18,
          },
        ],
      },
      {
        name: '捕鼠专家',
        type: 'passive',
        videoUrl: 'https://www.bilibili.com/video/BV1KcwbeXEHL?t=102.4',
        skillLevels: [
          {
            level: 1,
            description: '对老鼠造成伤害时回复Hp并加速。',
            detailedDescription:
              '对老鼠造成伤害时，回复25Hp并获得2.6秒的9.5%加速；若伤害来自爪刀，额外回复25Hp。',
          },
          {
            level: 2,
            description: '手握老鼠时依然可以攻击',
            detailedDescription:
              '手握老鼠时依然可以攻击，并可触发蓄势、击晕、三被等效果，但不会改变惯性（即不能用二被进行楼梯刀加速）',
          },
          {
            level: 3,
            description: '对老鼠造成伤害时，给予3秒沉默。',
          },
        ],
      },
    ],
  },
};

// （别动）
export default catCharacterDefinitions;
