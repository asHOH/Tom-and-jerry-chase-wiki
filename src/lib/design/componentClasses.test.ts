import { getFilterButtonActiveToneClasses } from './componentClasses';

describe('component classes', () => {
  it('uses accessible normal and hover colors for the neutral filter tone', () => {
    expect(getFilterButtonActiveToneClasses('neutral')).toContain(
      'bg-gray-400 text-gray-800 hover:bg-gray-300'
    );
    expect(getFilterButtonActiveToneClasses('neutral')).toContain(
      'dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-700'
    );
  });
});
