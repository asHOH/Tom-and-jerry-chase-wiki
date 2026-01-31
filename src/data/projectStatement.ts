import { PROJECT_INFO } from '@/constants';

export interface ProjectStatementCopy {
  creatorSeparator: string;
  projectInfo: {
    ariaLabel: string;
    maintainerPrefix: string;
    maintainerSuffix: string;
    repoLinkLabel: string;
    description: {
      beforeRepoLink: string;
      afterRepoLink: string;
      feedbackLinkText: string;
      afterFeedback: string;
    };
  };
  acknowledgements: {
    title: string;
    ariaLabel: string;
  };
  legal: {
    title: string;
    headings: {
      copyright: string;
      license: string;
    };
    copyright: {
      ariaLabel: string;
      brandLabel: string;
      brandTooltip: string;
      ownerTooltip: string;
      textPrefix: string;
      textSuffix: string;
    };
    license: {
      ariaLabel: string;
      linkSuffix: string;
      sentenceSuffix: string;
    };
  };
}

export const PROJECT_STATEMENT_COPY: ProjectStatementCopy = {
  creatorSeparator: '、',
  projectInfo: {
    ariaLabel: '项目信息',
    maintainerPrefix: '本项目由',
    maintainerSuffix: '维护，',
    repoLinkLabel: '项目主页',
    description: {
      beforeRepoLink: '已在 GitHub 开源（',
      afterRepoLink: '），欢迎',
      feedbackLinkText: PROJECT_INFO.descriptionParts.feedbackLink,
      afterFeedback: PROJECT_INFO.descriptionParts.after,
    },
  },
  acknowledgements: {
    title: '致谢',
    ariaLabel: '致谢详情',
  },
  legal: {
    title: '版权与许可',
    headings: {
      copyright: '版权声明',
      license: '开源许可',
    },
    copyright: {
      ariaLabel: '版权声明',
      brandLabel: '猫和老鼠',
      brandTooltip: 'Tom and Jerry',
      ownerTooltip: 'Warner Bros. Entertainment Inc.',
      textPrefix: '角色版权归',
      textSuffix: '所有。游戏素材版权归网易猫和老鼠手游所有。',
    },
    license: {
      ariaLabel: '开源许可',
      linkSuffix: ' 授权，',
      sentenceSuffix: '。',
    },
  },
};
