import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import PostsPage from '@/app/[locale]/(routes)/(dashboard)/posts/page';
import type { PostDto, PostPageDto } from '@/types/api/post';
import { postKeys } from '@/queries/post';
import { createMockPosts } from '@/lib/test/fixtures/post';

// PostListSection이 정렬별로 쓰는 파라미터와 같아야 캐시가 적중합니다.
const LATEST_LIST_PARAMS = { type: 'all', limit: 10 } as const;
const POPULAR_LIST_PARAMS = { type: 'best', limit: 10 } as const;

const toPage = (posts: PostDto[]): PostPageDto => ({
  posts,
  nextCursor: null,
  totalCount: posts.length,
});

// 네트워크 없이 보여주도록 캐시에 더미 데이터를 미리 넣습니다.
const createSeededClient = (posts: PostDto[]) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  const byViews = [...posts].sort((a, b) => b.viewCount - a.viewCount);
  client.setQueryData(postKeys.best(), {
    ...toPage(byViews.slice(0, 3)),
    totalCount: posts.length,
  });
  client.setQueryData(postKeys.list(LATEST_LIST_PARAMS), {
    pages: [toPage(posts)],
    pageParams: [undefined],
  });
  client.setQueryData(postKeys.list(POPULAR_LIST_PARAMS), {
    pages: [toPage(byViews)],
    pageParams: [undefined],
  });
  return client;
};

interface PostsPagePreviewProps {
  postCount: number;
}

const PostsPagePreview = ({ postCount }: PostsPagePreviewProps) => (
  <NextIntlClientProvider locale="ko" messages={{}}>
    <QueryClientProvider
      client={createSeededClient(createMockPosts(postCount))}
    >
      <div className="min-h-dvh bg-background p-4 md:p-6">
        <PostsPage />
      </div>
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const meta = {
  title: 'Posts/PostsPage',
  component: PostsPagePreview,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { postCount: 10 },
  argTypes: { postCount: { control: { type: 'range', min: 0, max: 10 } } },
} satisfies Meta<typeof PostsPagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { name: '게시글 목록' };

export const Empty: Story = {
  name: '빈 상태',
  args: { postCount: 0 },
};
