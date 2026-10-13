import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { fn } from 'storybook/test';

import Button from '@/components/ui/button/Button';
import Toaster from '@/components/ui/toast/Toaster';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import type { TodoDto } from '@/types/api/todo';
import TodoEditModal, { type TodoEditModalProps } from './TodoEditModal';

/** 수정할 할 일. mock 목록의 id 1을 덮어씁니다. */
const TODO_ID = 1;

const FILLED_TODO: Partial<TodoDto> = {
  title: '자바스크립트 기초 챕터3 듣기',
  done: true,
  goalId: 1,
  goal: { id: 1, title: '자바스크립트로 웹 서비스 만들기 1' },
  // KST 2026-10-10 23:59:59
  dueDate: '2026-10-10T14:59:59.000Z',
  tags: [
    { id: 1, name: '코딩' },
    { id: 2, name: '자기계발' },
    { id: 3, name: '공부' },
  ],
  linkUrl: 'https://www.codeit.com',
  fileUrl: null,
};

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
const ModalWithTrigger = ({ onClose, onUpdated }: TodoEditModalProps) => {
  const [todoId, setTodoId] = useState<number | null>(TODO_ID);

  return (
    <>
      <Button className="w-auto" onClick={() => setTodoId(TODO_ID)}>
        할 일 수정 열기
      </Button>
      <TodoEditModal
        todoId={todoId}
        onClose={() => {
          onClose();
          setTodoId(null);
        }}
        onUpdated={onUpdated}
      />
    </>
  );
};

const meta = {
  title: 'Todos/TodoEditModal',
  component: TodoEditModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { todoId: TODO_ID, onClose: fn(), onUpdated: fn() },
  render: (args) => <ModalWithTrigger {...args} />,
} satisfies Meta<typeof TodoEditModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
export const Default: Story = {
  name: '기본 (기존 값 채움)',
  beforeEach: () =>
    mockTodosApi({ totalCount: 5, todoOverrides: { [TODO_ID]: FILLED_TODO } }),
};

export const WithExistingImage: Story = {
  name: '기존 이미지 (유지·삭제·교체)',
  beforeEach: () =>
    mockTodosApi({
      totalCount: 5,
      todoOverrides: {
        [TODO_ID]: { ...FILLED_TODO, fileUrl: '/images/landing/img_sec02.png' },
      },
    }),
};

export const OutOfSpec: Story = {
  name: '규격 밖 기존 데이터 (목표·마감기한 없음, 제목 30자 초과)',
  beforeEach: () =>
    mockTodosApi({
      totalCount: 5,
      todoOverrides: {
        [TODO_ID]: {
          ...FILLED_TODO,
          title:
            '다른 화면에서 만든 아주 긴 제목의 할 일이라 서른 글자를 넘습니다',
          goalId: null,
          goal: null,
          dueDate: null,
        },
      },
    }),
};

export const Loading: Story = {
  name: '불러오는 중',
  beforeEach: () => mockTodosApi({ totalCount: 5, isDetailPending: true }),
};

export const FetchError: Story = {
  name: '조회 실패',
  beforeEach: () => mockTodosApi({ totalCount: 5, failDetail: true }),
};

export const UpdateError: Story = {
  name: '저장 실패 (입력값 유지 + 토스트)',
  beforeEach: () =>
    mockTodosApi({
      totalCount: 5,
      todoOverrides: { [TODO_ID]: FILLED_TODO },
      failMutations: true,
    }),
};
