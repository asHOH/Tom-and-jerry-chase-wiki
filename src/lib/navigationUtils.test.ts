import { navigate } from './navigationUtils';

const setOnlineStatus = (online: boolean) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: online,
  });
};

describe('navigationUtils', () => {
  afterEach(() => {
    setOnlineStatus(true);
  });

  it('should use client navigation while online', () => {
    const navigateClient = jest.fn();
    const navigateDocument = jest.fn();
    setOnlineStatus(true);

    navigate('/cards/', navigateClient, navigateDocument);

    expect(navigateClient).toHaveBeenCalledWith('/cards/');
    expect(navigateDocument).not.toHaveBeenCalled();
  });

  it('should use document navigation while offline', () => {
    const navigateClient = jest.fn();
    const navigateDocument = jest.fn();
    setOnlineStatus(false);

    navigate('/cards/', navigateClient, navigateDocument);

    expect(navigateClient).not.toHaveBeenCalled();
    expect(navigateDocument).toHaveBeenCalledWith('/cards/');
  });

  it.each([
    ['/cards', '/cards/'],
    ['/cards?from=home', '/cards/?from=home'],
    ['/cards#knowledge', '/cards/#knowledge'],
    ['/', '/'],
    ['https://example.com/cards', 'https://example.com/cards'],
  ])('should normalize offline document path %s', (targetPath, expectedPath) => {
    const navigateClient = jest.fn();
    const navigateDocument = jest.fn();
    setOnlineStatus(false);

    navigate(targetPath, navigateClient, navigateDocument);

    expect(navigateDocument).toHaveBeenCalledWith(expectedPath);
  });
});
