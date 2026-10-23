import type { Meta, StoryObj } from '@storybook/nextjs';
import BestPostCard from './BestPostCard';
import { createMockPosts } from '@/lib/test/fixtures/post';
import IntlTestProvider from '@/test/IntlTestProvider';

const [withImage, , withoutImage, , longTitle] = createMockPosts(5);

const meta = {
  title: 'Posts/BestPostCard',
  component: BestPostCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <IntlTestProvider>
        <Story />
      </IntlTestProvider>
    ),
  ],
  args: { post: withImage },
} satisfies Meta<typeof BestPostCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = { name: '이미지 있음' };

export const WithoutImage: Story = {
  name: '이미지 없음',
  args: { post: withoutImage },
};

export const LongTitle: Story = {
  name: '긴 제목',
  args: { post: longTitle },
};
