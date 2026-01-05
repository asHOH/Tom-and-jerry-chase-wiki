import { WikiChangeType, WikiDataHistory } from '@/data/types';

export const wikiHistoryData: WikiDataHistory = [
  {
    year: 2026,
    events: [
      {
        date: '1.4',
        description: '同步2026.1.1的正式服改动内容',
        details: {
          data: {
            changes: [
              {
                item: { name: '番茄', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内数值调整：番茄命中时的减速由30%降低到15%，持续时间降低到6秒；地面残留的持续时间降低到10秒，减速降低到15%。（该数据取自共研服公告）',
              },
              {
                item: { name: '烂番茄', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内数值调整：番茄命中时的减速由30%降低到15%，持续时间降低到6秒；地面残留的持续时间降低到10秒，减速降低到15%。（该数据取自共研服公告）',
              },
              {
                item: { name: '碎片', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：由破碎道具产生的碎片将会在10秒后自行消失。',
              },
              {
                item: { name: '冰块', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：天梯玩法中冰块在投掷后与队友不再产生碰撞，其他玩法不受影响。',
              },
              {
                item: { name: '护佑', type: 'knowledgeCard' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：护佑效果存在时，不再受烤箱加速和冰箱减速的抵消。',
              },
              {
                item: { name: '冰冻保鲜', type: 'specialSkill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：冰冻保鲜持续时间增加0.5秒，冷却时间减少至75秒，可通过再次点击技能键提前结束技能，但任何方式结束技能都会失去无敌效果。',
              },
              {
                item: { name: '圆滚滚', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：技能可在受到眩晕效果时释放，并立即解除该眩晕效果，但冷却时间会额外增加6秒。',
              },
              {
                item: { name: '茁壮成长', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内Lv.2新增效果：推奶酪时免疫眩晕。\n此外，修正了一处网站文案缺漏：Lv.2部分交互期间会获得恢复和减伤。（具体数值待测试）',
              },
              {
                item: { name: '友情庇护', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：转移队友的控制效果时，如果这个控制效果带有直接抓取效果，免疫该直接抓取效果。',
              },
              {
                item: { name: 'BOOM!!', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：炸毁火箭的恢复时间由5秒增加至12秒。',
              },
              {
                item: { name: '能源装置', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：强制原地充能时间由5秒减少至2秒。',
              },
              {
                item: { name: '机械身躯', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内Lv.2新增效果：受到的减速效果大幅降低（任何减速最多只能减少朵朵当前15%的最大移速）。（该数据取自共研服公告）',
              },
              {
                item: { name: '奶酪好手', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：Lv.2效果触发时的移动速度加成在52%的基础上继续增加，跳跃高度加成在25%的基础上继续增加；Lv.3效果触发时的移动速度加成在13%的基础上继续增加，Hp的回复量在20的基础上继续增加。（具体数值待测试）',
              },
              {
                item: { name: '分身大师', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：3级隐身的持续时间由10秒降低至5秒（与低等级保持一致），互换位置的冷却时间由5秒增加至8秒。',
              },
              {
                item: { name: '侦探泰菲分身', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：3级互换位置的冷却时间由5秒增加至8秒。',
              },
              {
                item: { name: '知识即力量', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：凯特捡回书后，将老鼠绑上火箭、放置老鼠夹的速度提升，并少量恢复Hp。',
              },
              {
                item: { name: '百科全书', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：凯特捡回书后，将老鼠绑上火箭、放置老鼠夹的速度提升，并少量恢复Hp。',
              },
              {
                item: { name: '剑客汤姆', type: 'character' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内基础属性调整：爪刀CD缩减至6秒（未命中CD同步缩减至2秒）。',
              },
              {
                item: { name: '汽水罐', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：Lv.1/lv.2的冷却时间由12秒缩减至8秒，Lv.3时技能可存储2次。',
              },
              {
                item: { name: '横冲直撞', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：前摇在0.6秒的基础上进一步缩减。（具体数值待测试）',
              },
              {
                item: { name: '旋转桶盖', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内Lv.2新增效果：命中敌方时减少本技能6秒CD，每次施放至多生效1次。',
              },
              {
                item: { name: '旋转桶盖', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内Lv.2新增效果：命中敌方时减少旋转桶盖技能6秒CD，每次施放至多生效1次。',
              },
              {
                item: { name: '我，兔八哥', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：被宣战的持续时间由15秒减少到10秒，持续期间不再重复触发。',
              },
              {
                item: { name: '垃圾桶', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：前摇缩短；减少爪刀冷却时间的效果在0.6秒的基础上继续增加；造成的伤害不再能虚弱老鼠，但仍会持续减少爪击的冷却时间；Lv.2及以上时会对Hp降至最低的老鼠造成1秒眩晕，每5秒触发一次。（部分具体数值待测试）',
              },
              {
                item: { name: '垃圾桶', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：减少爪刀冷却时间的效果在0.6秒的基础上继续增加；造成的伤害不再能虚弱老鼠，但仍会持续减少爪击的冷却时间；Lv.2及以上时会对Hp降至最低的老鼠造成1秒眩晕，每5秒触发一次。（部分具体数值待测试）',
              },
              {
                item: { name: '咸鱼', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：使用技能后一段时间内，可通过再次拖动技能进行1次咸鱼投掷，被命中的老鼠会受到鱼腥味的影响。（部分具体数值待测试）\n此外新增了机制，在未加点技能时也会进行技能冷却，且可存储2次。\n此外，将网站中的技能冷却时机改为“释放后”，使其符合游戏实际表现（存储已满时，释放二段技能后才进行冷却）。',
              },
              {
                item: { name: '咸鱼-投射物', type: 'entity' },
                changeType: WikiChangeType.CREATE,
                description: '为此全新衍生物创建界面。',
              },
              {
                item: { name: '牛仔的礼物', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：冷却由8/5/5增加至12/8/8，被弹簧仙人球拉扯后的免疫时间增长，在闪电仙人球加速期间触碰闪电仙人球连线不再重置持续时间，闪电仙人球造成的伤害和减速效果降低。',
              },
              {
                item: { name: '弹簧仙人球', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内机制调整：被弹簧仙人球拉扯后的免疫时间增长。',
              },
              {
                item: { name: '闪电仙人球', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '游戏内机制调整：在闪电仙人球加速期间触碰闪电仙人球连线不再重置持续时间，闪电仙人球造成的伤害和减速效果降低。',
              },
              {
                item: { name: '警戒', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内Lv.1冷却调整：由30秒缩减至25秒。',
              },
              {
                item: { name: '皇家火炮', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description: '游戏内Lv.1冷却调整：由45秒缩减至35秒。',
              },
            ],
          },
        },
      },
      {
        date: '1.5',
        description: '更改部分信息。',
        details: {
          data: {
            changes: [
              {
                item: { name: '兔八哥', type: 'character' },
                changeType: WikiChangeType.REWORK,
                description: '重制兔八哥的所有加点方案以及卡组信息，以适应当前版本。',
              },
              {
                item: { name: '幻影剑气', type: 'skill' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '修正有关剑气反弹的相关描述（实际为剑气只有命中角色/小黄鸭时才能反弹），以及幻影传送的描述（传送技能初始不可用，幻影生成时才转为可用状态）。',
              },
              {
                item: { name: '剑气', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '修正有关剑气反弹的相关描述（实际为剑气只有命中角色/小黄鸭时才能反弹），以及幻影传送的描述（传送技能初始不可用，幻影生成时才转为可用状态）。',
              },
              {
                item: { name: '幻影', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description: '添加幻影传送的描述（传送技能初始不可用，幻影生成时才转为可用状态）。',
              },
              {
                item: { name: '窝窝头', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '添加小熊猫拾取后提供的具体增益。',
              },
              {
                item: { name: '竹笋', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '添加小熊猫拾取后提供的具体增益。',
              },
              {
                item: { name: '萝卜墩', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '添加小熊猫拾取后提供的具体增益。',
              },
              {
                item: { name: '火箭', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加鼠方救援所需的具体时间数据。',
              },
              {
                item: { name: '受伤', type: 'buff' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加鼠方治疗所需的具体时间数据。',
              },
              {
                item: { name: '鼠虚弱', type: 'buff' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加鼠方治疗所需的具体时间数据。',
              },
              {
                item: { name: '炸毁', type: 'buff' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加修复火箭所需的具体时间数据。',
              },
              {
                item: { name: '修理锤', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加每次使用所需的具体时间数据。',
              },
              {
                item: { name: '黄金修理锤', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加每次使用所需的具体时间数据。',
              },
              {
                item: { name: '猫虚弱', type: 'buff' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加虚弱的具体时长数据。',
              },
              {
                item: { name: '冰桶', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加鼠方使用所需的具体时间数据，并调整了语序。',
              },
              {
                item: { name: '鞭炮堆', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加鼠方使用所需的具体时间数据，并调整了语序。',
              },
              {
                item: { name: '蛋糕', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '从本词条中分离出单独的蛋糕-旧版词条，因此调整了相关描述。',
              },
              {
                item: { name: '蛋糕-旧版', type: 'item' },
                changeType: WikiChangeType.CREATE,
                description: '为旧版蛋糕创建单独界面，用以与新版蛋糕作区分。',
              },
              {
                item: { name: '变身饮料', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加猫咪获得的跳跃高度提高的具体数值。',
              },
              {
                item: { name: '奶酪', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加搬运奶酪时的负面效果的具体数值。',
              },
              {
                item: { name: '拳套盒', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '在详细描述中添加猫咪受到伤害的具体数值（该数值实际与老鼠一致）；添加猫咪拆卸盒子的具体用时；添加老鼠推动盒子的具体速度。',
              },
              {
                item: { name: '玩具枪', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加内置使用间隔的具体时间数据。',
              },
              {
                item: { name: '狗骨头', type: 'item' },
                changeType: WikiChangeType.UPDATE,
                description:
                  '在详细描述中添加每次命中造成的具体眩晕时长数据，添加小狗泰克为鼠方提供的具体推奶酪加速数据。',
              },
              {
                item: { name: '泰克', type: 'entity' },
                changeType: WikiChangeType.UPDATE,
                description: '在详细描述中添加小狗泰克为鼠方提供的具体推奶酪加速数据。',
              },
              {
                item: { name: '泰菲', type: 'character' },
                changeType: WikiChangeType.REWORK,
                description:
                  '根据新版泰菲的数据，更改了与部分角色的克制关系及相关描述；调整了部分技能文案的语序。',
              },
            ],
          },
        },
      },
    ],
  },
];
