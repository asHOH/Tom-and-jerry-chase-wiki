import { act, fireEvent, render, screen } from '@testing-library/react';

import { DialogHost } from './DialogHost';
import { alertDialog, confirmDialog, promptDialog } from './dialogs';

it('queues confirmation and prompt requests and preserves their distinct results', async () => {
  render(<DialogHost />);
  let confirmation!: Promise<boolean>;
  let prompt!: Promise<string | null>;
  act(() => {
    confirmation = confirmDialog('确定删除？');
    prompt = promptDialog('请输入理由', '默认理由');
  });
  expect(screen.getByRole('alertdialog')).toHaveTextContent('确定删除？');
  expect(screen.queryByLabelText('请输入理由')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '取消' }));
  await expect(confirmation).resolves.toBe(false);
  const input = screen.getByLabelText('请输入理由');
  expect(input).toHaveValue('默认理由');
  fireEvent.change(input, { target: { value: '新的理由' } });
  fireEvent.click(screen.getByRole('button', { name: '确定' }));
  await expect(prompt).resolves.toBe('新的理由');
});

it('returns null for a cancelled prompt and retains selectable multiline copy text', async () => {
  render(<DialogHost />);
  let prompt!: Promise<string | null>;
  act(() => {
    prompt = promptDialog('复制以下内容：', '第一行\n第二行', { selectText: true });
  });
  const input = screen.getByLabelText('复制以下内容：') as HTMLTextAreaElement;
  expect(input).toHaveValue('第一行\n第二行');
  expect(input.selectionStart).toBe(0);
  expect(input.selectionEnd).toBe(input.value.length);
  fireEvent.keyDown(document, { key: 'Escape' });
  await expect(prompt).resolves.toBeNull();
});

it('keeps an acknowledgement open until the user accepts or presses Escape', async () => {
  render(<DialogHost />);
  let acknowledged = false;
  act(() => {
    void alertDialog('刷新失败').then(() => {
      acknowledged = true;
    });
  });
  expect(acknowledged).toBe(false);
  const panel = screen.getByRole('alertdialog');
  fireEvent.mouseDown(panel.previousElementSibling!);
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: '确定' }));
  });
  expect(acknowledged).toBe(true);
});
