import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';

import Toaster from '@/components/ui/toast/Toaster';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import TodosView from './TodosView';

/** 대시보드 레이아웃 배경 위에 테스트용 Provider(번역·Query)와 Toaster를 붙입니다. */
const withTodosPage: Decorator = (Story) => (
  <TestProviders>
    <div className="min-h-dvh bg-grayscale-100 px-4 pt-8 pb-4 md:p-6">
      <Story />
    </div>
    <Toaster />
  </TestProviders>
);

const meta = {
  title: 'Todos/TodosView',
  component: TodosView,
  parameters: { layout: 'fullscreen' },
  decorators: [withTodosPage],
} satisfies Meta<typeof TodosView>;

export default meta;
type Story = StoryObj<typeof meta>;

// beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
export const InfiniteScroll: Story = {
  name: '무한 스크롤 (90개, 40개씩)',
  beforeEach: () => mockTodosApi({ totalCount: 90 }),
};

export const DoneTabEmpty: Story = {
  name: 'DONE 탭만 비어 있음',
  beforeEach: () => mockTodosApi({ totalCount: 12, hasDone: false }),
};

export const Empty: Story = {
  name: '빈 목록',
  beforeEach: () => mockTodosApi({ totalCount: 0 }),
};

export const Loading: Story = {
  name: '불러오는 중',
  beforeEach: () => mockTodosApi({ totalCount: 90, isPending: true }),
};

export const FirstPageError: Story = {
  name: '첫 요청 실패',
  beforeEach: () => mockTodosApi({ totalCount: 90, failAt: 0 }),
};

export const NextPageError: Story = {
  name: '다음 페이지 실패',
  beforeEach: () => mockTodosApi({ totalCount: 90, failAt: 1 }),
};

export const MutationError: Story = {
  name: '수정·삭제·찜 요청 실패',
  beforeEach: () => mockTodosApi({ totalCount: 12, failMutations: true }),
};
