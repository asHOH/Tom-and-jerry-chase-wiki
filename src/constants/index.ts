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
