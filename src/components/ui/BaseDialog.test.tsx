import { render, screen } from '@testing-library/react';

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
});
