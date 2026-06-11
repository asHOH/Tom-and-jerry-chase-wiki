import { getActionButtonClasses, getFormControlClasses } from './utils';

describe('design utils', () => {
  describe('getActionButtonClasses', () => {
    it('should provide success and warning action variants', () => {
      expect(getActionButtonClasses('success')).toEqual(expect.stringContaining('bg-green-600'));
      expect(getActionButtonClasses('success')).toEqual(
        expect.stringContaining('hover:bg-green-700')
      );
      expect(getActionButtonClasses('warning')).toEqual(expect.stringContaining('bg-yellow-500'));
      expect(getActionButtonClasses('warning')).toEqual(
        expect.stringContaining('hover:bg-yellow-600')
      );
    });
  });

  describe('getFormControlClasses', () => {
    it('should return shared medium form control classes by default', () => {
      const classes = getFormControlClasses();

      expect(classes).toEqual(expect.stringContaining('w-full'));
      expect(classes).toEqual(expect.stringContaining('rounded-lg'));
      expect(classes).toEqual(expect.stringContaining('px-3'));
      expect(classes).toEqual(expect.stringContaining('py-3'));
      expect(classes).toEqual(expect.stringContaining('text-lg'));
      expect(classes).toEqual(expect.stringContaining('dark:bg-gray-800'));
    });

    it('should return compact classes for small form controls', () => {
      const classes = getFormControlClasses({ size: 'sm' });

      expect(classes).toEqual(expect.stringContaining('px-2'));
      expect(classes).toEqual(expect.stringContaining('py-2'));
      expect(classes).toEqual(expect.stringContaining('text-sm'));
      expect(classes).not.toEqual(expect.stringContaining('text-lg'));
    });

    it('should include invalid state classes and caller classes', () => {
      const classes = getFormControlClasses({ invalid: true, className: 'min-w-40' });

      expect(classes).toEqual(expect.stringContaining('border-red-500'));
      expect(classes).toEqual(expect.stringContaining('focus:ring-red-500'));
      expect(classes).toEqual(expect.stringContaining('min-w-40'));
    });
  });
});
