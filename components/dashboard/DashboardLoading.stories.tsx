import type { Meta, StoryObj } from '@storybook/nextjs';

import DashboardLoading from './DashboardLoading';

const meta = {
  title: 'Dashboard/DashboardLoading',
  component: DashboardLoading,
  parameters: { layout: 'padded' },
  args: {
    message: '불러오는 중입니다.',
    size: 'md',
    color: 'white',
  },
  argTypes: {
    message: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: { control: 'select', options: ['white', 'muted', 'foreground'] },
  },
  decorators: [
    (Story, context) => (
      // 테마 변수는 미리보기 영역에만 적용하며 앱의 테마 설정은 변경하지 않습니다.
      <div
        className={
          context.parameters.previewTheme === 'dark'
            ? 'max-w-lg rounded-2xl bg-grayscale-900 p-6 [--foreground:#f2f2f2] [--text-muted:#bbbbbb]'
            : 'max-w-lg rounded-2xl bg-white p-6 [--foreground:#333333] [--text-muted:#737373]'
        }
      >
        <div
          className={
            context.args.color === 'white'
              ? 'h-40 rounded-xl bg-orange-500 p-4'
              : 'h-40 p-4'
          }
        >
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof DashboardLoading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: '기본 / 흰색 · 24px' };
export const Small: Story = { name: '작게 / 20px', args: { size: 'sm' } };
export const Large: Story = { name: '크게 / 32px', args: { size: 'lg' } };
export const Muted: Story = {
  name: '보조 색상 / 라이트',
  args: { color: 'muted', message: '목표를 불러오는 중입니다.' },
};
export const Foreground: Story = {
  name: '기본 글자 색상 / 라이트',
  args: { color: 'foreground' },
};
export const Dark: Story = {
  name: '다크테마',
  args: { color: 'muted' },
  parameters: { previewTheme: 'dark' },
};
