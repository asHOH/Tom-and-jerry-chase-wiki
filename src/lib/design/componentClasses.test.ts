import { getFilterButtonActiveToneClasses } from './componentClasses';

describe('component classes', () => {
  it('uses the high-contrast semantic control colors for the strong neutral filter tone', () => {
    expect(getFilterButtonActiveToneClasses('strongNeutral')).toContain('border-control-active');
    expect(getFilterButtonActiveToneClasses('strongNeutral')).toContain('bg-control-active');
    expect(getFilterButtonActiveToneClasses('strongNeutral')).toContain(
      'hover:bg-control-active-hover'
    );
    expect(getFilterButtonActiveToneClasses('strongNeutral')).toContain(
      'text-gray-800 dark:text-gray-100'
    );
  });
});
