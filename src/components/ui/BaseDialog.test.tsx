import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { BaseDialog } from './BaseDialog';

describe('BaseDialog', () => {
  it('renders its panel as an elevated overlay surface', () => {
    render(
      <BaseDialog open onOpenChange={jest.fn()} ariaLabel='测试对话框' portal={false}>
        <div>对话框内容</div>
      </BaseDialog>
    );

    expect(screen.getByRole('dialog', { name: '测试对话框' })).toHaveClass(
      'rounded-xl',
      'bg-white',
      'shadow-xl',
      'dark:bg-slate-800'
    );
  });

  it('reports Escape and backdrop dismissal reasons', () => {
    const onOpenChange = jest.fn();
    const { container } = render(
      <BaseDialog open onOpenChange={onOpenChange} ariaLabel='测试对话框' portal={false}>
        <div>对话框内容</div>
      </BaseDialog>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'escape');

    const backdrop = container.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);
    expect(onOpenChange).toHaveBeenLastCalledWith(false, 'backdrop');
  });

  it('respects disabled Escape and backdrop dismissal', () => {
    const onOpenChange = jest.fn();
    const { container } = render(
      <BaseDialog
        open
        onOpenChange={onOpenChange}
        ariaLabel='测试对话框'
        closeOnEsc={false}
        closeOnOutsideClick={false}
        portal={false}
      >
        <div>对话框内容</div>
      </BaseDialog>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    const backdrop = container.querySelector<HTMLElement>('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.mouseDown(backdrop!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('locks scrolling and restores focus when closed', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(
      <BaseDialog open onOpenChange={jest.fn()} ariaLabel='测试对话框' portal={false}>
        <div>对话框内容</div>
      </BaseDialog>
    );

    expect(document.body.style.overflow).toBe('hidden');
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '测试对话框' })).toHaveFocus();
    });

    rerender(
      <BaseDialog open={false} onOpenChange={jest.fn()} ariaLabel='测试对话框' portal={false}>
        <div>对话框内容</div>
      </BaseDialog>
    );

    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('does not override focus placed inside the dialog', async () => {
    render(
      <BaseDialog open onOpenChange={jest.fn()} ariaLabel='测试对话框' portal={false}>
        <input aria-label='自动聚焦输入框' autoFocus />
      </BaseDialog>
    );

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: '自动聚焦输入框' })).toHaveFocus();
    });
  });
});
