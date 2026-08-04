import { contributors, RoleType } from '@/data/contributors';

// Use Chinese collator to keep name ordering deterministic for acknowledgements
const ZH_COLLATOR = new Intl.Collator('zh-Hans');

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
      // non-minor first, then stable zh name order
      const minorDelta = Number(aIsMinor) - Number(bIsMinor);
      if (minorDelta !== 0) return minorDelta;
      const nameDelta = ZH_COLLATOR.compare(a.name, b.name);
      if (nameDelta !== 0) return nameDelta;
      // final tiebreaker by id to keep stable ordering
      return a.id.localeCompare(b.id);
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
  title: '项目开源地址',
  url: 'https://github.com/asHOH/Tom-and-jerry-chase-wiki',
  maintainerId: 'asHOH',
  // Split description to make "给出建议" clickable
  descriptionParts: {
    before: '已在 GitHub 开源，欢迎',
    feedbackLink: '给出建议',
    after: '或点Star⭐！',
  },
};

// License information
export const LICENSE_INFO = {
  title: '开源许可',
  description: '本项目按内容类型使用不同许可证：',
  licenses: [
    {
      name: 'Creative Commons Attribution 4.0 International',
      shortName: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
      scope: '本项目原创内容与文档',
      additionalDescription:
        '仅限本项目有权授权的原创内容；第三方游戏素材不在许可范围内。使用时须署名原作者小曙光并链接到本项目的 GitHub 仓库',
    },
    {
      name: 'GNU General Public License v3.0',
      shortName: 'GPL v3',
      url: 'https://www.gnu.org/licenses/gpl-3.0.html',
      scope: '源代码',
      additionalDescription: '部署本网站者须公开完整的项目源代码',
    },
  ],
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站是独立维护的非官方玩家资料项目，仅供学习交流。',
  privacy:
    '为提供账户、评论、反馈、通知和安全防护功能，本网站可能处理用户名、昵称、联系方式、IP 地址、用户代理、访问记录及你主动提交的公开内容；部分功能还会使用第三方服务。相关信息仅在提供和维护服务所需范围内使用。请勿提交不必要的敏感个人信息。如需了解、更正或删除相关信息，请通过反馈功能联系项目维护者。',
  copyright:
    '本网站不代表 Warner Bros. Entertainment Inc.、Turner Entertainment Co.、网易或其他相关权利人。Tom and Jerry、相关角色、名称、标识及游戏素材的权利归相应权利人所有；本网站不因展示或整理相关资料而获得或授予相关知识产权。',
  takedownPolicy:
    '如您认为页面或素材涉及侵权，请通过反馈功能提供具体链接和权利证明，我们会在核查后按实际情况处理。',
  acknowledgements: generateAcknowledgements(),
};

// Generate plain text version for metadata
export const DISCLAIMER_TEXT = [
  DISCLAIMER_CONTENT.intro,
  DISCLAIMER_CONTENT.privacy,
  DISCLAIMER_CONTENT.copyright,
  DISCLAIMER_CONTENT.takedownPolicy,
  ...Object.values(DISCLAIMER_CONTENT.acknowledgements).map(
    (ack) =>
      `${ack.prefix}${ack.creators.map((id) => CREATORS[id]?.name ?? id).join('、')}${ack.suffix}`
  ),
].join('\n');

export const USER_CONTENT_COPY = {
  contribution:
    '我确认本次提交内容为我原创或已获授权；仅我有权授权的原创文字和文档按 CC BY 4.0 发布，第三方素材不在许可范围内。',
  community:
    '我确认本次内容不侵权、不违法、不含未经同意的个人信息，也不冒充官方，并同意遵守社区规则。',
  image: '我确认图片为我原创或已获公开展示和网络传播许可。',
  nonOfficialNotice: '非官方玩家资料站。本网站不代表游戏开发商、发行商、运营方或其他相关权利人。',
} as const;

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
