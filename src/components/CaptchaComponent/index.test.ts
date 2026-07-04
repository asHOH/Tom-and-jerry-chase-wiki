describe('CaptchaComponent', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  async function importSelector() {
    await jest.isolateModulesAsync(async () => {
      await import('./index');
    });
  }

  it.each([
    {
      provider: 'hcaptcha',
      activeModule: './HCaptchaComponent',
      inactiveModule: './TurnstileComponent',
    },
    {
      provider: 'turnstile',
      activeModule: './TurnstileComponent',
      inactiveModule: './HCaptchaComponent',
    },
  ])('does not load the inactive $provider provider module', async (testCase) => {
    jest.doMock('@/env', () => ({
      env: { NEXT_PUBLIC_CAPTCHA_PROVIDER: testCase.provider },
    }));
    jest.doMock('next/dynamic', () => ({
      __esModule: true,
      default: jest.fn(
        () =>
          function DynamicCaptchaComponent() {
            return null;
          }
      ),
    }));
    jest.doMock(testCase.activeModule, () => ({
      __esModule: true,
      default: function ActiveCaptchaComponent() {
        return null;
      },
    }));
    jest.doMock(testCase.inactiveModule, () => {
      throw new Error('Inactive captcha provider module should not be loaded');
    });

    await expect(importSelector()).resolves.toBeUndefined();
  });
});
