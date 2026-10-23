import type { Meta, StoryObj } from '@storybook/nextjs';
import { createMockPosts } from '@/lib/test/fixtures/post';
import IntlTestProvider from '@/test/IntlTestProvider';
import PostListItem from './PostListItem';

const [, , withoutImage, longContent, longTitle] = createMockPosts(5);

const meta = {
  title: 'Posts/PostListItem',
  component: PostListItem,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <IntlTestProvider>
        <Story />
      </IntlTestProvider>
    ),
  ],
  args: { post: longContent },
} satisfies Meta<typeof PostListItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = { name: '이미지 있음 / 긴 본문' };

export const WithoutImage: Story = {
  name: '이미지 없음',
  args: { post: withoutImage },
};

export const LongTitle: Story = {
  name: '긴 제목',
  args: { post: longTitle },
};
