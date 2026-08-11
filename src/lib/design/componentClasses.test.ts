import { getFilterButtonActiveToneClasses } from './componentClasses';

describe('component classes', () => {
  it('uses the high-contrast semantic control colors for the neutral filter tone', () => {
    expect(getFilterButtonActiveToneClasses('neutral')).toContain('border-control-active');
    expect(getFilterButtonActiveToneClasses('neutral')).toContain('bg-control-active');
    expect(getFilterButtonActiveToneClasses('neutral')).toContain('hover:bg-control-active-hover');
    expect(getFilterButtonActiveToneClasses('neutral')).toContain(
      'text-gray-800 dark:text-gray-100'
    );
  });
});
