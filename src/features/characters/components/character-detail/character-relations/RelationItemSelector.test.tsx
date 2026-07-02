import { fireEvent, render, screen } from '@testing-library/react';

import RelationItemSelector from './RelationItemSelector';

jest.mock('@/components/Image', () => ({
  __esModule: true,
  default: ({ alt, className, src }: { alt: string; className?: string; src: string }) => (
    <span aria-label={alt} className={className} data-src={src} role='img' />
  ),
}));

describe('RelationItemSelector', () => {
  const options = [{ id: '选项一', imageUrl: '/images/one.png' }, { id: '选项二' }];

  it('renders nothing when options is empty', () => {
    const { container } = render(
      <RelationItemSelector
        options={[]}
        triggerAriaLabel='添加项目'
        optionAriaLabel={(id) => `选择项目 ${id}`}
        onSelect={jest.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('opens the menu when the plus button is clicked', () => {
    render(
      <RelationItemSelector
        options={options}
        triggerAriaLabel='添加项目'
        optionAriaLabel={(id) => `选择项目 ${id}`}
        onSelect={jest.fn()}
      />
    );

    const trigger = screen.getByRole('button', { name: '添加项目' });
    expect(trigger).toHaveClass('h-8', 'w-8', 'bg-green-100', 'text-green-800');

    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: '选择项目 选项一' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '选择项目 选项二' })).toBeInTheDocument();
  });

  it('renders option labels and optional images', () => {
    render(
      <RelationItemSelector
        options={[{ id: '带图选项', imageUrl: '/images/option.png', imageClassName: 'rounded' }]}
        triggerAriaLabel='添加项目'
        optionAriaLabel={(id) => `选择项目 ${id}`}
        onSelect={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '添加项目' }));

    expect(screen.getByText('带图选项')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '带图选项' })).toHaveClass('h-5', 'w-5', 'rounded');
  });

  it('calls onSelect and closes the menu after option click', () => {
    const onSelect = jest.fn();

    render(
      <RelationItemSelector
        options={options}
        triggerAriaLabel='添加项目'
        optionAriaLabel={(id) => `选择项目 ${id}`}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '添加项目' }));
    fireEvent.click(screen.getByRole('button', { name: '选择项目 选项一' }));

    expect(onSelect).toHaveBeenCalledWith('选项一');
    expect(screen.queryByRole('button', { name: '选择项目 选项一' })).not.toBeInTheDocument();
  });

  it('does not open when disabled is true', () => {
    render(
      <RelationItemSelector
        options={options}
        triggerAriaLabel='添加项目'
        optionAriaLabel={(id) => `选择项目 ${id}`}
        onSelect={jest.fn()}
        disabled
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '添加项目' }));

    expect(screen.queryByRole('button', { name: '选择项目 选项一' })).not.toBeInTheDocument();
  });
});
