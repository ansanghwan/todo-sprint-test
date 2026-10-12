import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { fn } from 'storybook/test';

import Button from '@/components/ui/button/Button';
import Toaster from '@/components/ui/toast/Toaster';
import IntlTestProvider from '@/test/IntlTestProvider';
import GoalCreateModal, { type GoalCreateModalProps } from './GoalCreateModal';

const Preview = (props: GoalCreateModalProps) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <>
      <Button className="w-auto" onClick={() => setIsOpen(true)}>
        목표 생성 열기
      </Button>
      <GoalCreateModal
        {...props}
        isOpen={isOpen}
        onOpenChange={(open) => {
          props.onOpenChange(open);
          setIsOpen(open);
        }}
      />
    </>
  );
};

const meta = {
  title: 'Goals/GoalCreateModal',
  component: GoalCreateModal,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <IntlTestProvider>
        <div className="min-h-dvh bg-grayscale-100 p-6">
          <Story />
        </div>
        <Toaster />
      </IntlTestProvider>
    ),
  ],
  args: { isOpen: true, onOpenChange: fn(), onSubmit: fn(async () => {}) },
  render: (args) => <Preview {...args} />,
} satisfies Meta<typeof GoalCreateModal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const SubmitError: Story = {
  args: {
    onSubmit: fn(async () => {
      throw new Error('Create failed');
    }),
  },
};
