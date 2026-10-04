import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { scheduleBackgroundPreparation } from '@/lib/scheduleBackgroundPreparation';
import { searchDialogModule } from '@/components/panelModules';

import SearchBar from './SearchBar';

function MockSearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  mockMount();
  return open ? (
    <div role='dialog' aria-label='完整搜索'>
      <button onClick={onClose}>关闭搜索</button>
    </div>
  ) : null;
}

let mockComponent: typeof MockSearchDialog | undefined;
const mockMount = jest.fn();
const mockLoad = jest.fn();

jest.mock('@/components/panelModules', () => ({
  searchDialogModule: {
    get: () => mockComponent,
    load: () => mockLoad(),
  },
}));
jest.mock('@/lib/scheduleBackgroundPreparation', () => ({
  scheduleBackgroundPreparation: jest.fn(() => jest.fn()),
}));
jest.mock('@/hooks/useMediaQuery', () => ({ useMobile: () => false }));
jest.mock('./Tooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('./MotionButton', () => ({
  __esModule: true,
  default: ({
    whileHover: _hover,
    whileTap: _tap,
    variant: _variant,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    whileHover?: unknown;
    whileTap?: unknown;
    variant?: string;
  }) => <button {...props} />,
}));
jest.mock('./BaseDialog', () => ({
  BaseDialog: ({
    open,
    children,
    ariaLabel,
  }: {
    open: boolean;
    children: ReactNode;
    ariaLabel: string;
  }) =>
    open ? (
      <div role='dialog' aria-label={ariaLabel}>
        {children}
      </div>
    ) : null,
}));

beforeEach(() => {
  mockComponent = undefined;
  mockLoad.mockReset();
  mockLoad.mockImplementation(async () => {
    mockComponent = MockSearchDialog;
    return { default: MockSearchDialog };
  });
});

it('prepares in the background without mounting search, then opens prepared code immediately', async () => {
  const view = render(<SearchBar />);
  expect(mockLoad).not.toHaveBeenCalled();
  const tasks = jest.mocked(scheduleBackgroundPreparation).mock.calls[0]![0];
  await tasks[0]!();
  view.rerender(<SearchBar />);
  expect(mockMount).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '搜索' }));
  expect(screen.getByRole('dialog', { name: '完整搜索' })).toBeInTheDocument();
  expect(screen.queryByText('正在准备搜索…')).not.toBeInTheDocument();
});

it('starts preparation on focus without opening search', () => {
  render(<SearchBar />);
  fireEvent.focus(screen.getByRole('button', { name: '搜索' }));
  expect(mockLoad).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('honors an early keyboard request, and does not reopen if closed while loading', async () => {
  let finish!: (value: { default: typeof MockSearchDialog }) => void;
  mockLoad.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  render(<SearchBar />);
  fireEvent.keyDown(document, { key: '/' });
  expect(mockLoad).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('status')).toHaveTextContent('正在准备搜索');
  fireEvent.click(screen.getByRole('button', { name: '关闭' }));
  await act(async () => {
    mockComponent = MockSearchDialog;
    finish({ default: MockSearchDialog });
  });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '搜索' }));
  expect(screen.getByRole('dialog', { name: '完整搜索' })).toBeInTheDocument();
});

it('offers retry when an early interactive download fails', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockLoad.mockRejectedValueOnce(new Error('network failed'));
  render(<SearchBar />);
  fireEvent.click(screen.getByRole('button', { name: '搜索' }));
  expect(await screen.findByText('搜索加载失败，请重试')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '重试' }));
  expect(await screen.findByRole('dialog', { name: '完整搜索' })).toBeInTheDocument();
  expect(mockLoad).toHaveBeenCalledTimes(2);
});

it('does not intercept typing / in an input', () => {
  render(
    <>
      <input aria-label='输入' />
      <SearchBar />
    </>
  );
  fireEvent.keyDown(screen.getByLabelText('输入'), { key: '/' });
  expect(searchDialogModule.get()).toBeUndefined();
  expect(mockLoad).not.toHaveBeenCalled();
});
