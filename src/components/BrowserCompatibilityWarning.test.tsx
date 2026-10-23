import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { StorageKey } from '@/lib/localStorage';

import BrowserCompatibilityWarning from './BrowserCompatibilityWarning';

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('BaiduBrowser Android');
});

afterEach(() => {
  document.cookie = 'force_continue=;path=/;max-age=0';
  window.history.replaceState(null, '', '/');
});

it.each(['BaiduBrowser Android', 'Mozilla/5.0 Android bdbrowser/1.0', 'Android baidu/1.0'])(
  'shows a compatibility warning for %s while keeping page content available',
  (ua) => {
    jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
    render(
      <>
        <p>百科内容</p>
        <BrowserCompatibilityWarning />
      </>
    );

    expect(screen.getByRole('dialog', { name: '浏览器兼容性提示' })).toHaveAccessibleDescription(
      /检测到您正在使用百度浏览器/
    );
    expect(screen.getByText('百科内容')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chrome 浏览器' })).toHaveAttribute(
      'href',
      'https://www.google.cn/chrome/'
    );
    expect(screen.getByRole('link', { name: 'Firefox 浏览器' })).toHaveAttribute(
      'href',
      'https://www.firefox.com/zh-CN/browsers/mobile/android/'
    );
  }
);

it.each(['Mozilla/5.0 Android Chrome/130.0', 'Mozilla/5.0 Firefox/130.0', 'Baiduspider/2.0'])(
  'does not show a warning for %s',
  (ua) => {
    jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua);
    render(<BrowserCompatibilityWarning />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }
);

it.each(['button', 'Escape'])('remembers dismissal by %s across mounts', async (method) => {
  const { unmount } = render(<BrowserCompatibilityWarning />);
  if (method === 'button') {
    fireEvent.click(screen.getByRole('button', { name: '继续访问，不再提示' }));
  } else {
    fireEvent.keyDown(document, { key: 'Escape' });
  }

  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(localStorage.getItem(StorageKey.BrowserCompatibilityDismissed)).toBe('1');
  unmount();
  render(<BrowserCompatibilityWarning />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it.each(['query', 'cookie'])('preserves an existing %s override', (source) => {
  if (source === 'query') {
    window.history.replaceState(null, '', '/?force_continue=1&from=old-link');
  } else {
    document.cookie = 'force_continue=1;path=/';
  }

  render(<BrowserCompatibilityWarning />);

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(localStorage.getItem(StorageKey.BrowserCompatibilityDismissed)).toBe('1');
});

it('still allows dismissal when browser storage is unavailable', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Storage blocked', 'SecurityError');
  });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage blocked', 'SecurityError');
  });

  render(<BrowserCompatibilityWarning />);
  fireEvent.click(screen.getByRole('button', { name: '继续访问，不再提示' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
