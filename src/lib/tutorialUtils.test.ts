import { hasUserSeenTutorial, markTutorialAsSeen, resetTutorial } from './tutorialUtils';

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
});
