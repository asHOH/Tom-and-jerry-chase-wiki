import { useState } from 'react';
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
      'bg-surface-raised',
      'text-foreground',
      'shadow-xl'
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

  it('restores the trigger after an autofocus field takes focus during mount', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>打开</button>
          <BaseDialog open={open} onOpenChange={setOpen} ariaLabel='表单'>
            <input aria-label='名称' autoFocus />
          </BaseDialog>
        </>
      );
    }
    render(<Example />);
    const trigger = screen.getByRole('button', { name: '打开' });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });

  it('keeps a parent open and scroll locked while the child handles dismissal', async () => {
    function Example() {
      const [parentOpen, setParentOpen] = useState(true);
      const [childOpen, setChildOpen] = useState(false);
      return (
        <BaseDialog open={parentOpen} onOpenChange={setParentOpen} ariaLabel='父窗口'>
          <button onClick={() => setChildOpen(true)}>打开子窗口</button>
          <BaseDialog open={childOpen} onOpenChange={setChildOpen} ariaLabel='子窗口'>
            <button>子窗口按钮</button>
          </BaseDialog>
        </BaseDialog>
      );
    }
    render(<Example />);
    const parent = screen.getByRole('dialog', { name: '父窗口' });
    await waitFor(() => expect(parent).toHaveFocus());
    const trigger = screen.getByRole('button', { name: '打开子窗口' });
    trigger.focus();
    fireEvent.click(trigger);
    const child = screen.getByRole('dialog', { name: '子窗口' });
    await waitFor(() => expect(child).toHaveFocus());
    expect(Number(child.style.zIndex)).toBeGreaterThan(Number(parent.style.zIndex));
    fireEvent.mouseDown(parent.previousElementSibling!);
    expect(parent).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.body.style.overflow).toBe('');
  });

  it('lets a field consume Escape before dismissing the dialog', () => {
    const onOpenChange = jest.fn();
    render(
      <BaseDialog open onOpenChange={onOpenChange} ariaLabel='编辑'>
        <input aria-label='名称' onKeyDown={(event) => event.preventDefault()} />
      </BaseDialog>
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('keeps a simultaneously mounted child above its parent', async () => {
    const onParentChange = jest.fn();
    const onChildChange = jest.fn();
    render(
      <BaseDialog open onOpenChange={onParentChange} ariaLabel='父窗口'>
        <BaseDialog open onOpenChange={onChildChange} ariaLabel='子窗口'>
          内容
        </BaseDialog>
      </BaseDialog>
    );
    const parent = screen.getByRole('dialog', { name: '父窗口' });
    const child = screen.getByRole('dialog', { name: '子窗口' });
    await waitFor(() => expect(child).toHaveFocus());
    expect(Number(child.style.zIndex)).toBeGreaterThan(Number(parent.style.zIndex));
    fireEvent.keyDown(child, { key: 'Escape' });
    expect(onChildChange).toHaveBeenCalledWith(false, 'escape');
    expect(onParentChange).not.toHaveBeenCalled();
  });

  it('cycles Tab from the panel and both edges while preserving external portal focus', async () => {
    // JSDOM has no layout; give visible controls a box for tabbable's visibility check.
    const rectangles = jest
      .spyOn(HTMLElement.prototype, 'getClientRects')
      .mockReturnValue([new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList);
    try {
      render(
        <>
          <button>外部控件</button>
          <BaseDialog open onOpenChange={jest.fn()} ariaLabel='表单'>
            <button>第一个</button>
            <button disabled>禁用</button>
            <input aria-label='最后一个' />
          </BaseDialog>
        </>
      );
      const panel = screen.getByRole('dialog');
      const first = screen.getByRole('button', { name: '第一个' });
      const last = screen.getByRole('textbox');
      await waitFor(() => expect(panel).toHaveFocus());
      fireEvent.keyDown(panel, { key: 'Tab', shiftKey: true });
      expect(last).toHaveFocus();
      fireEvent.keyDown(last, { key: 'Tab' });
      expect(first).toHaveFocus();
      fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
      expect(last).toHaveFocus();
      panel.focus();
      fireEvent.keyDown(panel, { key: 'Tab' });
      expect(first).toHaveFocus();

      const outside = screen.getByRole('button', { name: '外部控件' });
      outside.focus();
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      outside.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
      expect(outside).toHaveFocus();
    } finally {
      rectangles.mockRestore();
    }
  });

  it('returns to the original trigger after nested autofocus dialogs close', async () => {
    function Example() {
      const [open, setOpen] = useState(false);
      const [childOpen, setChildOpen] = useState(true);
      return (
        <>
          <button onClick={() => setOpen(true)}>打开嵌套窗口</button>
          {open && (
            <BaseDialog open onOpenChange={setOpen} ariaLabel='父窗口'>
              <BaseDialog open={childOpen} onOpenChange={setChildOpen} ariaLabel='子窗口'>
                <input aria-label='子窗口输入' autoFocus />
              </BaseDialog>
            </BaseDialog>
          )}
        </>
      );
    }
    render(<Example />);
    const trigger = screen.getByRole('button', { name: '打开嵌套窗口' });
    trigger.focus();
    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: '父窗口' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });

  it('keeps Tab on an empty dialog', async () => {
    render(
      <BaseDialog open onOpenChange={jest.fn()} ariaLabel='提示'>
        内容
      </BaseDialog>
    );
    const panel = screen.getByRole('dialog');
    await waitFor(() => expect(panel).toHaveFocus());
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    panel.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(panel).toHaveFocus();
  });

  it('ignores pending focus work after unmount', async () => {
    const { unmount } = render(
      <BaseDialog open onOpenChange={jest.fn()} ariaLabel='临时窗口'>
        内容
      </BaseDialog>
    );
    unmount();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    await Promise.resolve();
    expect(outside).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
    outside.remove();
  });
});
