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
    after: '，点Star⭐或通过 QQ 交流群加入我们！',
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
      scope: '本项目有权授权的原创数据与文档内容',
      additionalDescription:
        '第三方素材不在许可范围内；使用时请按许可证要求署名相关作者、链接许可证与本项目的 GitHub 仓库，并注明是否作出修改',
    },
    {
      name: 'GNU General Public License v3.0',
      shortName: 'GPL v3',
      url: 'https://www.gnu.org/licenses/gpl-3.0.html',
      scope: '源代码',
      additionalDescription: '分发本项目或其修改版本时，须遵守许可证规定的相应条件',
    },
  ],
};

// Structured disclaimer content - single source of truth
export const DISCLAIMER_CONTENT = {
  intro: '本网站是独立维护的非官方玩家资料项目，仅供学习与交流。',
  privacy:
    '为提供账户、评论、反馈、通知、安全防护与站点分析等功能，本网站可能处理用户名、昵称、联系方式、IP 地址、用户代理、访问记录及用户主动提交的公开内容；启用的第三方服务也可能处理相关数据。具体处理情况取决于所启用的功能和部署环境。请勿提交不必要的敏感个人信息；如需查询、更正或删除相关信息，请通过本站提供的反馈或联系渠道联系维护者。',
  copyright:
    '本网站不代表 Warner Bros. Entertainment Inc.、Turner Entertainment Co.、网易或其他相关权利人，也不表示其认可、赞助或与本网站存在合作关系。Tom and Jerry、相关角色、名称、标识及游戏素材的权利归相应权利人所有。',
  thirdPartyMaterials:
    '本站部分页面可能展示第三方游戏画面、地图、图标及其他素材，用于相关内容的识别、说明和讨论。本网站不主张这些素材的所有权，不将其纳入本项目的开源许可，也不授予他人再使用许可。',
  takedownPolicy:
    '如您认为页面或素材涉及侵权，请通过本站提供的反馈或联系渠道提交具体链接、权利说明及必要的证明材料；维护者会在核查后按实际情况处理。',
  acknowledgements: generateAcknowledgements(),
};

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
