import { PROJECT_INFO } from '@/constants';

export interface ProjectStatementCopy {
  creatorSeparator: string;
  staticMirror: {
    ariaLabel: string;
    lead: string;
    contributor: string;
    tail: string;
  };
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
  privacy: {
    title: string;
    ariaLabel: string;
  };
  legal: {
    title: string;
    headings: {
      copyright: string;
      thirdPartyMaterials: string;
      license: string;
    };
    copyright: {
      ariaLabel: string;
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
  staticMirror: {
    ariaLabel: '静态版本说明',
    lead: '该网站的静态产物编译贡献者为 ',
    contributor: '九归零',
    tail: '，此项目位于原官方项目的其中一条分支上，请在部署此版本时添加此说明。',
  },
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
  privacy: {
    title: '隐私',
    ariaLabel: '隐私说明',
  },
  legal: {
    title: '版权与许可',
    headings: {
      copyright: '版权声明',
      thirdPartyMaterials: '第三方素材说明',
      license: '开源许可',
    },
    copyright: {
      ariaLabel: '版权声明',
    },
    license: {
      ariaLabel: '开源许可',
      linkSuffix: ' 授权，',
      sentenceSuffix: '。',
    },
  },
};
