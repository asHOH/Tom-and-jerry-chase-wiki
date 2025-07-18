export interface TutorialStep {
  id: string;
  targetSelector: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'character-name-edit',
    targetSelector: '[data-tutorial-id="character-name-edit"]',
    message: '角色名称，若要创建新角色，请将此处的角色名更改为新的。',
    position: 'bottom',
  },
  {
    id: 'skill-allocation-edit',
    targetSelector: '[data-tutorial-id="skill-allocation-edit"]',
    message:
      '加点序列，0123分别表示被动、主动、一武、二武。中括号表示平行加点，需要根据实际情况抉择加点顺序是12还是21；小括号表示需要留加点（莉莉、罗菲二被）；减号表示一般不升这级（苏蕊三级跳舞），示例：01(0)1[10]22-2。',
    position: 'bottom',
  },
  {
    id: 'skill-description-edit',
    targetSelector: '[data-tutorial-id="skill-description-edit"]',
    message:
      '技能描述，可以使用[]()来标记注释。方括号内的内容会在技能卡片中直接显示，圆括号内的内容会在鼠标悬停或点击时显示为提示；可以使用{}来表示非固定伤害，花括号里的数字作为总伤害会在技能卡片中直接显示，具体伤害组成会在鼠标悬停或点击时显示为提示。',
    position: 'bottom',
  },
  {
    id: 'character-preview',
    targetSelector: '[data-tutorial-id="character-preview"]',
    message: '预览按钮，点击后可以预览非编辑模式下该角色信息显示的效果。',
    position: 'bottom',
  },
  {
    id: 'character-export',
    targetSelector: '[data-tutorial-id="character-export"]',
    message:
      '保存按钮，点击后会将角色的数据复制到剪切板中并下载成文件，由于网站存储角色数据不稳定，请多多保存。',
    position: 'bottom',
  },
  {
    id: 'character-tutorial',
    targetSelector: '[data-tutorial-id="character-tutorial"]',
    message: '教程按钮，点击此按钮可重新查看角色页面的功能指引。',
    position: 'bottom',
  },
];

const TUTORIAL_SEEN_KEY = 'hasUserSeenCharacterDetailsTutorial';

export const hasUserSeenCharacterDetailsTutorial = (): boolean => {
  if (typeof window === 'undefined') {
    return true; // Assume seen on server-side rendering
  }
  return localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
};

export const markCharacterDetailsTutorialAsSeen = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
  }
};

export const resetCharacterDetailsTutorial = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TUTORIAL_SEEN_KEY);
  }
};
