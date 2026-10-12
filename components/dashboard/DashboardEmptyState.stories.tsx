import type { Meta, StoryObj } from '@storybook/nextjs';

import DashboardEmptyState from './DashboardEmptyState';

const meta = {
  title: 'Dashboard/DashboardEmptyState',
  component: DashboardEmptyState,
  parameters: { layout: 'padded' },
  args: { message: '최근에 등록한 목표가 없어요' },
  argTypes: { message: { control: 'text' } },
  decorators: [
    (Story, context) => (
      // 카드 배경·높이는 사용처에서 정하고, 메시지와 이미지는 컴포넌트가 표시합니다.
      <div
        className={
          context.parameters.previewTheme === 'dark'
            ? 'flex min-h-80 max-w-2xl items-center justify-center rounded-2xl bg-grayscale-900 p-6 [--text-muted:#bbbbbb]'
            : 'flex min-h-80 max-w-2xl items-center justify-center rounded-2xl bg-white p-6 [--text-muted:#737373]'
        }
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DashboardEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: '목표 없음' };
export const NoTodos: Story = {
  name: '할 일 없음',
  args: { message: '등록된 할 일이 없어요' },
};
export const NoSearchResults: Story = {
  name: '검색 결과 없음',
  args: { message: '검색 결과가 없습니다.' },
};
export const Dark: Story = {
  name: '다크테마',
  parameters: { previewTheme: 'dark' },
};
