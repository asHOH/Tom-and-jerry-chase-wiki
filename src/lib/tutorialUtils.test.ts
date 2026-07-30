import {
  hasUserSeenTutorial,
  markTutorialAsSeen,
  resetTutorial,
  TUTORIAL_HELP_LINKS,
  TUTORIAL_STEPS,
} from './tutorialUtils';

describe('tutorialUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should track character-edit and toolbar tutorials independently', () => {
    expect(hasUserSeenTutorial('character-edit')).toBe(false);
    expect(hasUserSeenTutorial('edit-mode-toolbar')).toBe(false);

    markTutorialAsSeen('edit-mode-toolbar');

    expect(hasUserSeenTutorial('character-edit')).toBe(false);
    expect(hasUserSeenTutorial('edit-mode-toolbar')).toBe(true);
  });

  it('should reset only the requested tutorial', () => {
    markTutorialAsSeen('character-edit');
    markTutorialAsSeen('edit-mode-toolbar');

    resetTutorial('character-edit');

    expect(hasUserSeenTutorial('character-edit')).toBe(false);
    expect(hasUserSeenTutorial('edit-mode-toolbar')).toBe(true);
  });

  it('keeps first-time edit onboarding focused on edit, preview, and submit', () => {
    expect(TUTORIAL_STEPS['edit-mode-toolbar']).toHaveLength(3);
    expect(TUTORIAL_STEPS['edit-mode-toolbar'].map((step) => step.id)).toEqual([
      'edit-page-content',
      'edit-mode-toolbar-preview',
      'edit-mode-toolbar-publish',
    ]);
    expect(TUTORIAL_HELP_LINKS['edit-mode-toolbar']).toEqual({
      href: '/usages/edit',
      label: '查看完整编辑指南',
    });
  });
});
