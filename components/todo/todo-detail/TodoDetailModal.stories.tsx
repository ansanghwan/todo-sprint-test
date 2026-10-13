import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { fn } from 'storybook/test';

import Button from '@/components/ui/button/Button';
import Toaster from '@/components/ui/toast/Toaster';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import type { TodoDto } from '@/types/api/todo';
import TodoDetailModal, { type TodoDetailModalProps } from './TodoDetailModal';

/** 볼 할 일. mock 목록의 id 1을 덮어씁니다. */
const TODO_ID = 1;

const FULL_TODO: Partial<TodoDto> = {
  title: '자바스크립트 기초 챕터1 듣기',
  done: false,
  goalId: 1,
  goal: { id: 1, title: '자바스크립트로 웹 서비스 만들기 1' },
  // KST 2026-10-10 23:59:59
  dueDate: '2026-10-10T14:59:59.000Z',
  tags: [
    { id: 1, name: '코딩' },
    { id: 2, name: '자기계발' },
    { id: 3, name: '공부' },
  ],
  linkUrl: 'https://www.codeit.kr',
  fileUrl: '/images/landing/img_sec02.png',
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
const ModalWithTrigger = ({
  onClose,
  onEdit,
  onDelete,
}: TodoDetailModalProps) => {
  const [todoId, setTodoId] = useState<number | null>(TODO_ID);

  return (
    <>
      <Button className="w-auto" onClick={() => setTodoId(TODO_ID)}>
        할 일 상세 열기
      </Button>
      <TodoDetailModal
        todoId={todoId}
        onClose={() => {
          onClose();
          setTodoId(null);
        }}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
};

const meta = {
  title: 'Todos/TodoDetailModal',
  component: TodoDetailModal,
  parameters: { layout: 'fullscreen' },
  decorators: [withProviders],
  args: { todoId: TODO_ID, onClose: fn(), onEdit: fn(), onDelete: fn() },
  render: (args) => <ModalWithTrigger {...args} />,
} satisfies Meta<typeof TodoDetailModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const withTodo = (todo: Partial<TodoDto>) => () =>
  mockTodosApi({ totalCount: 5, todoOverrides: { [TODO_ID]: todo } });

// beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
export const Default: Story = {
  name: '기본 (링크·이미지 모두 있음)',
  beforeEach: withTodo(FULL_TODO),
};

export const Done: Story = {
  name: '완료한 할 일 (DONE 칩)',
  beforeEach: withTodo({ ...FULL_TODO, done: true }),
};

export const LinkOnly: Story = {
  name: '첨부자료: 링크만',
  beforeEach: withTodo({ ...FULL_TODO, fileUrl: null }),
};

export const NoAttachments: Story = {
  name: '첨부자료 없음 (영역 숨김)',
  beforeEach: withTodo({ ...FULL_TODO, linkUrl: null, fileUrl: null }),
};

export const MissingValues: Story = {
  name: '목표·마감기한·태그 없음, 긴 제목',
  beforeEach: withTodo({
    ...FULL_TODO,
    title:
      '다른 화면에서 만든 아주 긴 제목의 할 일이라 모달 폭을 넘어 줄바꿈됩니다',
    goalId: null,
    goal: null,
    dueDate: null,
    tags: [],
  }),
};

export const Loading: Story = {
  name: '불러오는 중',
  beforeEach: () => mockTodosApi({ totalCount: 5, isDetailPending: true }),
};

export const FetchError: Story = {
  name: '조회 실패 (토스트 + 다시 시도)',
  beforeEach: () => mockTodosApi({ totalCount: 5, failDetail: true }),
};
