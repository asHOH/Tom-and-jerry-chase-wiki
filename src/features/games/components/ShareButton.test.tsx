import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ShareButton from './ShareButton';

const mockCopy = jest.fn();
const mockSuccess = jest.fn();

jest.mock('@/hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({ copied: false, copy: mockCopy }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({ success: mockSuccess }),
}));

describe('ShareButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
  });

  it('uses the native share sheet when available', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    });

    render(<ShareButton getShareText={() => '分享内容'} />);
    fireEvent.click(screen.getByRole('button', { name: '分享结果' }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({ text: '分享内容' }));
    expect(mockCopy).not.toHaveBeenCalled();
  });

  it('copies the share text when native sharing is unavailable', async () => {
    mockCopy.mockResolvedValue(true);

    render(<ShareButton getShareText={() => '复制内容'} />);
    fireEvent.click(screen.getByRole('button', { name: '分享结果' }));

    await waitFor(() => expect(mockCopy).toHaveBeenCalledWith('复制内容'));
    expect(mockSuccess).toHaveBeenCalledWith('已复制到剪贴板');
  });
});
