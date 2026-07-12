export type TutorialType = 'character-edit' | 'edit-mode-toolbar';

export type TutorialStep = {
  id: string;
  targetSelector: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
};

export const TUTORIAL_STEPS: Record<TutorialType, readonly TutorialStep[]> = {
  'character-edit': [
    {
      id: 'character-name-edit',
      targetSelector: '[data-tutorial-id="character-name-edit"]',
      message: '角色信息可直接点击编辑。修改会保存在本地草稿中，直到您通过底部工具栏发布或放弃。',
      position: 'bottom',
    },
    {
      id: 'skill-allocation-edit',
      targetSelector: '[data-tutorial-id="skill-allocation-edit"]',
      message:
        '加点序列。0123分别表示被动、主动、一武、二武。中括号表示平行加点；小括号表示需要留加点；减号表示一般不升这级。示例：01(0)1[10]22-2。',
      position: 'bottom',
    },
    {
      id: 'skill-description-edit',
      targetSelector: '[data-tutorial-id="skill-description-edit"]',
      message:
        '技能描述可使用[文字](注释)标记注释，使用{总伤害}表示非固定伤害；也可使用{名称/别名}引用角色、技能、知识卡、特技、道具或文档。',
      position: 'bottom',
    },
    {
      id: 'skill-video-url-edit',
      targetSelector: '[data-tutorial-id="skill-video-url-edit"]',
      message:
        '视频链接按钮可显示或隐藏链接输入框。B站视频网址可追加?t=时间来指定开始播放时间，例如?t=61.5。',
      position: 'bottom',
    },
  ],
  'edit-mode-toolbar': [
    {
      id: 'edit-mode-toolbar-drag',
      targetSelector: '[data-tutorial-id="edit-mode-toolbar-drag"]',
      message: '可拖动这里调整编辑工具栏的位置。',
      position: 'top',
    },
    {
      id: 'edit-mode-toolbar-drafts',
      targetSelector: '[data-tutorial-id="edit-mode-toolbar-drafts"]',
      message: '草稿可查看当前保存的本地修改。',
      position: 'top',
    },
    {
      id: 'edit-mode-toolbar-preview',
      targetSelector: '[data-tutorial-id="edit-mode-toolbar-preview"]',
      message: '预览可暂时查看非编辑模式下的信息显示。',
      position: 'top',
    },
    {
      id: 'edit-mode-toolbar-publish',
      targetSelector: '[data-tutorial-id="edit-mode-toolbar-publish"]',
      message: '完成修改后，点击发布并填写说明提交；也可通过退出或放弃按钮离开编辑模式。',
      position: 'top',
    },
  ],
};

const TUTORIAL_SEEN_KEYS: Record<TutorialType, string> = {
  'character-edit': 'hasUserSeenCharacterEditTutorial',
  'edit-mode-toolbar': 'hasUserSeenEditModeToolbarTutorial',
};

export const hasUserSeenTutorial = (tutorial: TutorialType): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(TUTORIAL_SEEN_KEYS[tutorial]) === 'true';
};

export const markTutorialAsSeen = (tutorial: TutorialType): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TUTORIAL_SEEN_KEYS[tutorial], 'true');
  }
};

export const resetTutorial = (tutorial: TutorialType): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TUTORIAL_SEEN_KEYS[tutorial]);
  }
};
