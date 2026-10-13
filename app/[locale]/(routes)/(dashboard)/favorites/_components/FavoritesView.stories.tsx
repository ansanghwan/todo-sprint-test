import type { Decorator, Meta, StoryObj } from '@storybook/nextjs';

import Toaster from '@/components/ui/toast/Toaster';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import FavoritesView from './FavoritesView';

/** 대시보드 레이아웃 배경 위에 테스트용 Provider(번역·Query)와 Toaster를 붙입니다. */
const withFavoritesPage: Decorator = (Story) => (
  <TestProviders>
    <div className="min-h-dvh bg-grayscale-100 px-4 pt-8 pb-4 md:p-6">
      <Story />
    </div>
    <Toaster />
  </TestProviders>
);

const meta = {
  title: 'Todos/FavoritesView',
  component: FavoritesView,
  parameters: { layout: 'fullscreen' },
  decorators: [withFavoritesPage],
} satisfies Meta<typeof FavoritesView>;

export default meta;
type Story = StoryObj<typeof meta>;

// mock은 id가 5의 배수인 할 일을 찜한 상태로 만들고, 목표 3개를 차례로 붙입니다.
// beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
export const Default: Story = {
  name: '기본 (찜 12개, 목표 3개)',
  beforeEach: () => mockTodosApi({ totalCount: 60, withGoals: true }),
};

export const ManyPages: Story = {
  name: '100개 넘음 (찜 120개, 2번에 나눠 조회)',
  beforeEach: () => mockTodosApi({ totalCount: 600, withGoals: true }),
};

export const Empty: Story = {
  name: '찜한 할 일 없음',
  beforeEach: () => mockTodosApi({ totalCount: 4, withGoals: true }),
};

export const Loading: Story = {
  name: '불러오는 중',
  beforeEach: () => mockTodosApi({ totalCount: 60, isPending: true }),
};

export const SecondPageError: Story = {
  name: '두 번째 페이지 실패',
  beforeEach: () =>
    mockTodosApi({ totalCount: 600, withGoals: true, failFavoritesAt: 1 }),
};

export const MutationError: Story = {
  name: '완료·찜·삭제 요청 실패',
  beforeEach: () =>
    mockTodosApi({ totalCount: 60, withGoals: true, failMutations: true }),
};
