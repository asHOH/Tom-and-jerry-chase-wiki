// Creator information for building links
export const CREATORS = {
  dreamback: {
    name: '梦回_淦德蒸蚌',
    url: 'https://space.bilibili.com/1193776217',
    contribution: '测试数据'
  },
  momo: {
    name: '是莫莫喵',
    url: 'https://space.bilibili.com/443541296',
    contribution: '测试数据'
  },
  fanshuwa: {
    name: '凡叔哇',
    url: 'https://space.bilibili.com/273122087',
    contribution: '图片素材'
  }
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站为粉丝制作，仅供学习交流使用，并非官方网站。',
  copyright: '素材版权均归网易猫和老鼠手游所有。',
  testDataAttribution: {
    prefix: '特别鸣谢b站up主',
    creators: ['dreamback', 'momo'] as const,
    suffix: '提供的测试数据。'
  },
  imageAttribution: {
    prefix: '特别鸣谢b站up主',
    creators: ['fanshuwa'] as const,
    suffix: '分享的图片素材。'
  }
};

// Generate plain text version for metadata
export const DISCLAIMER_TEXT = [
  DISCLAIMER_CONTENT.intro,
  DISCLAIMER_CONTENT.copyright,
  `${DISCLAIMER_CONTENT.testDataAttribution.prefix}${DISCLAIMER_CONTENT.testDataAttribution.creators.map(id => CREATORS[id].name).join('、')}${DISCLAIMER_CONTENT.testDataAttribution.suffix}`,
  `${DISCLAIMER_CONTENT.imageAttribution.prefix}${DISCLAIMER_CONTENT.imageAttribution.creators.map(id => CREATORS[id].name).join('、')}${DISCLAIMER_CONTENT.imageAttribution.suffix}`
].join('\n');
