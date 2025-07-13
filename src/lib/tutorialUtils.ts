export interface TutorialStep {
  id: string;
  targetSelector: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  // {
  //   id: 'edit-button',
  //   targetSelector: '[data-tutorial-id="edit-button"]',
  //   message: 'Click this button to enter edit mode and modify character details.',
  //   position: 'bottom',
  // },
  // {
  //   id: 'save-button',
  //   targetSelector: '[data-tutorial-id="save-button"]',
  //   message: 'After making changes, click here to save them.',
  //   position: 'bottom',
  // },
  // {
  //   id: 'cancel-button',
  //   targetSelector: '[data-tutorial-id="cancel-button"]',
  //   message: 'Discard your changes by clicking this button.',
  //   position: 'bottom',
  // },
  {
    id: 'character-name-edit',
    targetSelector: '[data-tutorial-id="character-name-edit"]',
    message: '若要创建新角色，请将此处的角色名更改为新的。',
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
