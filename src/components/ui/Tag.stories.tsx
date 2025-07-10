import type { Meta, StoryObj } from '@storybook/react';
import Tag from './Tag';

const meta: Meta<typeof Tag> = {
  title: 'UI/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    size: { control: 'select', options: ['xs', 'sm', 'md'] },
    variant: { control: 'select', options: ['default', 'compact'] },
    colorStyles: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default Tag',
    colorStyles: {
      backgroundColor: '#e0e0e0',
      color: '#333333',
    },
    size: 'md',
    variant: 'default',
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    children: 'Small Tag',
    size: 'sm',
  },
};

export const ExtraSmall: Story = {
  args: {
    ...Default.args,
    children: 'Extra Small Tag',
    size: 'xs',
  },
};

export const Compact: Story = {
  args: {
    ...Default.args,
    children: 'Compact Tag',
    variant: 'compact',
  },
};

export const PositioningTag: Story = {
  args: {
    children: 'Attack Tag',
    colorStyles: {
      backgroundColor: '#fecaca',
      color: '#dc2626', // attack red
    },
  },
};
