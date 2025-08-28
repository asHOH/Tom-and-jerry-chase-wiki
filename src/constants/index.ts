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
  // Get the ID of the project maintainer to exclude them from other acknowledgments
  const projectMaintainerId = contributors.find((contributor) =>
    contributor.roles.some((role) => role.type === RoleType.ProjectMaintainer)
  )?.id;

  return contributors
    .filter(
      (contributor) =>
        contributor.id !== projectMaintainerId && // Exclude the project maintainer
        contributor.roles.some((role) => role.type === roleType)
    )
    .sort((a, b) => {
      const aIsMinor = a.roles.some((role) => role.type === roleType && role.isMinor);
      const bIsMinor = b.roles.some((role) => role.type === roleType && role.isMinor);
      return Number(aIsMinor) - Number(bIsMinor);
    })
    .map((contributor) => contributor.id);
};

// Generate acknowledgements dynamically
const generateAcknowledgements = () => {
  const acknowledgements: Record<string, { prefix: string; creators: string[]; suffix: string }> =
    {};

  (Object.keys(RoleType) as Array<keyof typeof RoleType>).forEach((roleKey) => {
    const roleType = RoleType[roleKey];

    // Skip ProjectMaintainer role from acknowledgments to avoid awkward self-thanks
    if (roleType === RoleType.ProjectMaintainer) {
      return;
    }

    const creators = getContributorsByRole(roleType);
    if (creators.length > 0) {
      const key = roleType.toLowerCase().replace(/\s+/g, '');
      acknowledgements[key] = {
        prefix: '感谢',
        creators,
        suffix: `${roleType}。`,
      };
    }
  });

  return acknowledgements;
};

// Project information
export const PROJECT_INFO = {
  name: '项目开源地址',
  url: 'https://github.com/asHOH/Tom-and-jerry-chase-wiki',
  description: '本项目已在GitHub开源，欢迎参与建设、给出建议或点star⭐！',
  maintainerId: 'asHOH',
  // Split description to make "给出建议" clickable
  descriptionParts: {
    before: '本项目已在GitHub开源，欢迎参与建设、',
    feedbackLink: '给出建议',
    after: '或点star⭐！',
  },
};

// License information
export const LICENSE_INFO = {
  title: '开源许可',
  description: '本项目采用双重许可证：',
  licenses: [
    {
      name: 'Creative Commons Attribution 4.0 International',
      shortName: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      scope: '内容与文档',
      additionalDescription: '使用时须署名原作者 asHOH 并链接到本项目对应的 GitHub 仓库',
    },
    {
      name: 'GNU General Public License v3.0',
      shortName: 'GPL v3',
      url: 'https://www.gnu.org/licenses/gpl-3.0.html',
      scope: '源代码',
      additionalDescription: '部署本网站者须将完整的项目源代码向所有用户公开',
    },
  ],
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站为非盈利粉丝项目，仅供学习交流。',
  privacyPolicy: '本网站承诺永不收集任何用户数据。',
  freePolicy: '本网站承诺所有功能永久免费。',
  copyright:
    '猫和老鼠（Tom and Jerry）角色版权归华纳兄弟娱乐公司（Warner Bros. Entertainment Inc.）所有。游戏素材版权归网易猫和老鼠手游所有。',
  takedownPolicy: '若版权方提出要求，我们将立即调整。',
  acknowledgements: generateAcknowledgements(),
};

// Generate plain text version for metadata
export const DISCLAIMER_TEXT = [
  DISCLAIMER_CONTENT.intro,
  DISCLAIMER_CONTENT.privacyPolicy,
  DISCLAIMER_CONTENT.freePolicy,
  DISCLAIMER_CONTENT.copyright,
  DISCLAIMER_CONTENT.takedownPolicy,
  ...Object.values(DISCLAIMER_CONTENT.acknowledgements).map(
    (ack) =>
      `${ack.prefix}${ack.creators.map((id) => CREATORS[id]?.name ?? id).join('、')}${ack.suffix}`
  ),
].join('\n');

// Helper function to get ContentWriter contributors for a specific character
export const getContentWritersByCharacter = (characterId: string): string[] => {
  return contributors
    .filter((contributor) =>
      contributor.roles.some(
        (role) => role.type === RoleType.ContentWriter && role.characters?.includes(characterId)
      )
    )
    .map((contributor) => contributor.name);
};
