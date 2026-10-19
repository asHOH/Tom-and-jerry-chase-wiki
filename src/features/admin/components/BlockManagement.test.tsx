import { fireEvent, render, screen } from '@testing-library/react';

import BlockManagement from './BlockManagement';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

it('announces validation and request failures, then replaces them with successful block feedback', async () => {
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: '保存被拒绝' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
  global.fetch = fetchMock;
  const mutateBlocks = jest.fn();

  render(
    <BlockManagement
      blocks={[]}
      logs={[]}
      users={[{ id: '00000000-0000-4000-8000-000000000001', nickname: 'Alice' }]}
      resourceOptions={{}}
      canManage
      mutateBlocks={mutateBlocks}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: '创建封禁' }));
  expect(screen.getByRole('alert')).toHaveTextContent('请填写理由并至少选择一项限制。');
  expect(fetchMock).not.toHaveBeenCalled();

  fireEvent.change(screen.getByDisplayValue('选择账号'), {
    target: { value: '00000000-0000-4000-8000-000000000001' },
  });
  fireEvent.change(screen.getByPlaceholderText('封禁理由'), { target: { value: '重复骚扰' } });
  fireEvent.click(screen.getByRole('button', { name: '创建封禁' }));
  expect(await screen.findByText('保存被拒绝')).toHaveAttribute('role', 'alert');
  expect(mutateBlocks).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: '创建封禁' }));
  expect(await screen.findByRole('status')).toHaveTextContent('封禁已创建');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(mutateBlocks).toHaveBeenCalledTimes(1);
});
