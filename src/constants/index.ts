import { contributors, RoleType } from '@/data/contributors';

// Create a map of contributors for easy lookup
export const CREATORS = contributors.reduce(
  (acc, contributor) => {
    acc[contributor.id] = contributor;
    return acc;
  },
  {} as Record<string, (typeof contributors)[number]>
);

// Helper function to get contributors by role type
const getContributorsByRole = (roleType: RoleType): string[] => {
  return contributors
    .filter((contributor) => contributor.roles.some((role) => role.type === roleType))
    .map((contributor) => contributor.id);
};

// Dynamic acknowledgements configuration
const ACKNOWLEDGEMENT_CONFIG = {
  [RoleType.DataTester]: {
    prefix: '感谢',
    suffix: '提供测试数据。',
  },
  [RoleType.ArtProvider]: {
    prefix: '感谢',
    suffix: '分享图片素材。',
  },
  [RoleType.ContentWriter]: {
    prefix: '感谢',
    suffix: '撰写网页内容。',
  },
  [RoleType.Developer]: {
    prefix: '感谢',
    suffix: '进行项目开发。',
  },
  [RoleType.ContentProofreader]: {
    prefix: '感谢',
    suffix: '进行内容校对。',
  },
  [RoleType.VideoCreator]: {
    prefix: '感谢',
    suffix: '制作教学视频。',
  },
} as const;

// Generate acknowledgements dynamically
const generateAcknowledgements = () => {
  const acknowledgements: Record<string, { prefix: string; creators: string[]; suffix: string }> =
    {};

  Object.entries(ACKNOWLEDGEMENT_CONFIG).forEach(([roleType, config]) => {
    const creators = getContributorsByRole(roleType as RoleType);
    if (creators.length > 0) {
      const key = roleType.toLowerCase().replace(/\s+/g, '');
      acknowledgements[key] = {
        prefix: config.prefix,
        creators,
        suffix: config.suffix,
      };
    }
  });

  return acknowledgements;
};

// Project information
export const PROJECT_INFO = {
  name: '项目开源地址',
  url: 'https://github.com/asHOH/Tom-and-jerry-chase-wiki',
  description: '本项目已在GitHub开源，欢迎贡献数据、代码和建议！觉得有帮助也欢迎点star⭐！',
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站为非盈利粉丝项目，仅供学习交流。',
  privacyPolicy: '本网站承诺永不收集或分析任何用户数据。',
  freePolicy: '本网站承诺所有功能永久免费。',
  fraudWarning: '反诈提醒：如有任何网站声称是本项目但要求付费，请捂紧钱包并举报！',
  copyright:
    '猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。',
  takedownPolicy: '若版权方提出要求，我们将立即配合调整。反馈渠道：Github Issues。',
  acknowledgements: generateAcknowledgements(),
};

// Generate plain text version for metadata
export const DISCLAIMER_TEXT = [
  DISCLAIMER_CONTENT.intro,
  DISCLAIMER_CONTENT.copyright,
  DISCLAIMER_CONTENT.takedownPolicy,
  DISCLAIMER_CONTENT.privacyPolicy,
  DISCLAIMER_CONTENT.freePolicy,
  DISCLAIMER_CONTENT.fraudWarning,
  ...Object.values(DISCLAIMER_CONTENT.acknowledgements).map(
    (ack) =>
      `${ack.prefix}${ack.creators.map((id) => CREATORS[id]?.name ?? id).join('、')}${ack.suffix}`
  ),
].join('\n');
