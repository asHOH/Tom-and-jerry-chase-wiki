// Creator information for building links
export const CREATORS = {
  dreamback: {
    name: '梦回_淦德蒸蚌',
    url: 'https://space.bilibili.com/1193776217',
    contribution: '测试数据',
  },
  momo: {
    name: '是莫莫喵',
    url: 'https://space.bilibili.com/443541296',
    contribution: '测试数据',
  },
  fanshuwa: {
    name: '凡叔哇',
    url: 'https://space.bilibili.com/273122087',
    contribution: '图片素材',
  },
};

// Project information
export const PROJECT_INFO = {
  name: '项目开源地址',
  url: 'https://github.com/asHOH/Tom-and-jerry-chase-wiki',
  description: '本项目已在GitHub开源，欢迎贡献数据、代码和建议！觉得有帮助也欢迎点star！',
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站为非盈利粉丝项目，仅供学习交流。',
  copyright:
    '猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。',
  takedownPolicy: '若版权方提出要求，我们将立即配合调整相关内容。反馈渠道：Github Issues。',
  testDataAttribution: {
    prefix: '特别鸣谢b站up主',
    creators: ['dreamback', 'momo'] as const,
    suffix: '提供的测试数据。',
  },
  imageAttribution: {
    prefix: '特别鸣谢b站up主',
    creators: ['fanshuwa'] as const,
    suffix: '分享的图片素材。',
  },
};

// Generate plain text version for metadata
export const DISCLAIMER_TEXT = [
  DISCLAIMER_CONTENT.intro,
  DISCLAIMER_CONTENT.copyright,
  DISCLAIMER_CONTENT.takedownPolicy,
  `${DISCLAIMER_CONTENT.testDataAttribution.prefix}${DISCLAIMER_CONTENT.testDataAttribution.creators.map((id) => CREATORS[id].name).join('、')}${DISCLAIMER_CONTENT.testDataAttribution.suffix}`,
  `${DISCLAIMER_CONTENT.imageAttribution.prefix}${DISCLAIMER_CONTENT.imageAttribution.creators.map((id) => CREATORS[id].name).join('、')}${DISCLAIMER_CONTENT.imageAttribution.suffix}`,
].join('\n');
