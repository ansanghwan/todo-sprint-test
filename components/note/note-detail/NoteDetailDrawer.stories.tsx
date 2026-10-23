import type { Meta, StoryObj } from '@storybook/nextjs';
import { fn } from 'storybook/test';

import Toaster from '@/components/ui/toast/Toaster';
import TestProviders from '@/test/TestProviders';
import { mockTodosApi } from '@/test/todoMocks';
import NoteDetailDrawer from './NoteDetailDrawer';

/**
 * 노트 상세 (FN-NT-04·05, FN-TD-11). PC는 오른쪽 Drawer, 태블릿·모바일은 전체 화면 바텀시트입니다.
 * mock 서버는 id가 4의 배수인 할 일에 같은 id의 노트를 연결합니다.
 */
const meta = {
  title: 'Notes/NoteDetailDrawer',
  component: NoteDetailDrawer,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <TestProviders>
        <div className="min-h-dvh bg-grayscale-100" />
        <Story />
        <Toaster />
      </TestProviders>
    ),
  ],
  args: { noteId: 4, onClose: fn() },
} satisfies Meta<typeof NoteDetailDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// beforeEach가 돌려준 함수로 스토리를 떠날 때 mock API를 되돌립니다.
export const Default: Story = {
  name: '기본',
  beforeEach: () =>
    mockTodosApi({
      totalCount: 4,
      withGoals: true,
      todoOverrides: {
        4: {
          title: '자바스크립트 기초 챕터1 듣기',
          tags: [
            { id: 1, name: '코딩' },
            { id: 2, name: '공부' },
          ],
        },
      },
    }),
};

export const Loading: Story = {
  name: '불러오는 중',
  beforeEach: () => mockTodosApi({ totalCount: 4, delay: 600_000 }),
};

export const FetchError: Story = {
  name: '조회 실패',
  beforeEach: () => mockTodosApi({ totalCount: 4, failNote: true }),
};
