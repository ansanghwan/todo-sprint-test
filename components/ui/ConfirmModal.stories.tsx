import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';

import Button from './button/Button';
import ConfirmModal from './ConfirmModal';
import IntlTestProvider from '@/test/IntlTestProvider';

const meta = {
  title: 'UI/ConfirmModal',
  component: ConfirmModal,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <IntlTestProvider>
        <Story />
      </IntlTestProvider>
    ),
  ],
  args: {
    isOpen: false,
    title: '정말 삭제하시겠어요?',
    description: '삭제된 목표는 복구할 수 없습니다.',
    cancelLabel: '취소',
    confirmLabel: '확인',
    isPending: false,
    onOpenChange: () => undefined,
    onConfirm: () => undefined,
  },
  argTypes: {
    isOpen: { control: false },
    title: { control: 'text' },
    description: { control: 'text' },
    isPending: { control: 'boolean' },
  },
  render: function Preview(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>확인 팝업 열기</Button>
        <ConfirmModal
          {...args}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          // 미리보기에서는 실제 삭제 요청 없이 팝업만 닫습니다.
          onConfirm={() => setIsOpen(false)}
        />
      </>
    );
  },
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: '삭제 확인 미리보기' };
export const WithoutDescription: Story = {
  name: '안내 문구 없음',
  args: { title: '작성을 취소하시겠어요?', description: undefined },
};
