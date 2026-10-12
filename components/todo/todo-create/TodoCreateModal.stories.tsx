import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { fn } from 'storybook/test';

import Button from '@/components/ui/button/Button';
import Toaster from '@/components/ui/toast/Toaster';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import TodoCreateModal, { type TodoCreateModalProps } from './TodoCreateModal';

/** 테스트용 Provider(번역·Query)와 Toaster를 붙입니다. */
const withProviders: Decorator = (Story) => (
  <TestProviders>
    <div className="min-h-dvh bg-grayscale-100 p-6">
      <Story />
    </div>
    <Toaster />
  </TestProviders>
);

/** 닫은 뒤 다시 열어 볼 수 있게 열림 상태를 직접 들고 있습니다. */
const ModalWithTrigger = ({
  onOpenChange,
  initialGoal,
  onCreated,
}: TodoCreateModalProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <Button className="w-auto" onClick={() => setIsOpen(true)}>
        할 일 생성 열기
      </Button>
      <TodoCreateModal
        initialGoal={initialGoal}
        onCreated={onCreated}
        isOpen={isOpen}
        onOpenChange={(nextIsOpen) => {
          onOpenChange(nextIsOpen);
          setIsOpen(nextIsOpen);
        }}
      />
    </>
  );
};

const meta = {
  title: 'Todos/TodoCreateModal',
  component: TodoCreateModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { isOpen: true, onOpenChange: fn(), onCreated: fn() },
  render: (args) => <ModalWithTrigger {...args} />,
} satisfies Meta<typeof TodoCreateModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
export const Default: Story = {
  name: '기본 (목표 25개, 10개씩)',
  beforeEach: () => mockTodosApi({ totalCount: 12 }),
};

export const WithInitialGoal: Story = {
  name: '목표를 미리 선택 (첫 페이지에 없는 목표)',
  args: { initialGoal: { id: 23, title: '프론트엔드 면접 준비하기 23' } },
  beforeEach: () => mockTodosApi({ totalCount: 12 }),
};

export const NoGoals: Story = {
  name: '목표 없음',
  beforeEach: () => mockTodosApi({ totalCount: 12, goalCount: 0 }),
};

export const GoalsError: Story = {
  name: '목표 조회 실패',
  beforeEach: () => mockTodosApi({ totalCount: 12, failGoals: true }),
};

export const CreateError: Story = {
  name: '생성 실패 (입력값 유지 + 토스트)',
  beforeEach: () => mockTodosApi({ totalCount: 12, failCreate: true }),
};

export const UploadError: Story = {
  name: '이미지 업로드 실패',
  beforeEach: () => mockTodosApi({ totalCount: 12, failUpload: true }),
};
