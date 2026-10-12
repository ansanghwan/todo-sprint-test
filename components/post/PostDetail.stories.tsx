import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import ClientSuspense from '@/components/boundaries/ClientSuspense';
import { ApiError } from '@/lib/api/errors';
import { createMockPosts } from '@/lib/test/fixtures/post';
import { postKeys } from '@/queries/post';
import { userKeys } from '@/queries/user';
import type { UserDto } from '@/types/api/user';
import PostDetail from './PostDetail';
import PostDetailErrorBoundary from './PostDetailErrorBoundary';
import PostDetailSkeleton from './PostDetailSkeleton';

const [
  postWithImage,
  postWithLongWriterName,
  postWithoutImage,
  ,
  postWithLongTitle,
] = createMockPosts(5);
// 작성자 이름은 API 기준 최대 20자입니다.
postWithLongWriterName.writer = {
  ...postWithLongWriterName.writer,
  name: '이름이아주아주아주긴작성자닉네임입니다요',
};
const OTHER_USER_ID = postWithImage.writer.id + 1;
const MISSING_POST_ID = 404;

type PostState =
  'withImage' | 'withoutImage' | 'longTitle' | 'longWriterName' | 'notFound';

const POST_IDS: Record<PostState, number> = {
  withImage: postWithImage.id,
  withoutImage: postWithoutImage.id,
  longTitle: postWithLongTitle.id,
  longWriterName: postWithLongWriterName.id,
  notFound: MISSING_POST_ID,
};

// 네트워크 없이 보여주도록 캐시에 더미 데이터를 미리 넣습니다.
const createSeededClient = (isMine: boolean) => {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  [
    postWithImage,
    postWithoutImage,
    postWithLongTitle,
    postWithLongWriterName,
  ].forEach((post) => client.setQueryData(postKeys.detail(post.id), post));
  client
    .getQueryCache()
    .build(client, { queryKey: postKeys.detail(MISSING_POST_ID) })
    .setState({
      status: 'error',
      error: new ApiError('http', 'Not found', { status: 404 }),
    });
  client.setQueryData(userKeys.me(), {
    id: isMine ? postWithImage.writer.id : OTHER_USER_ID,
  } as UserDto);
  return client;
};

interface PostDetailPreviewProps {
  postState: PostState;
  isMine: boolean;
  isLoading?: boolean;
}

// 상세 page.tsx는 async 서버 컴포넌트라 스토리에서는 같은 카드 구성을 직접 그립니다.
const PostDetailPreview = ({
  postState,
  isMine,
  isLoading = false,
}: PostDetailPreviewProps) => (
  <NextIntlClientProvider locale="ko" messages={{}}>
    <QueryClientProvider client={createSeededClient(isMine)}>
      <div className="min-h-dvh bg-background p-4 md:p-6">
        <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white-section px-5 py-6 md:rounded-4xl md:p-10 lg:p-14">
          {isLoading ? (
            <PostDetailSkeleton />
          ) : (
            <PostDetailErrorBoundary>
              <ClientSuspense fallback={<PostDetailSkeleton />}>
                <PostDetail postId={POST_IDS[postState]} />
              </ClientSuspense>
            </PostDetailErrorBoundary>
          )}
        </div>
      </div>
    </QueryClientProvider>
  </NextIntlClientProvider>
);

const meta = {
  title: 'Posts/PostDetail',
  component: PostDetailPreview,
  parameters: { layout: 'fullscreen', nextjs: { appDirectory: true } },
  args: { postState: 'withImage', isMine: true },
  argTypes: {
    postState: {
      control: 'inline-radio',
      options: Object.keys(POST_IDS),
    },
  },
} satisfies Meta<typeof PostDetailPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mine: Story = { name: '내 게시글 (케밥 표시)' };

export const Others: Story = {
  name: '다른 사람 게시글',
  args: { isMine: false },
};

export const WithoutImage: Story = {
  name: '이미지 없음',
  args: { postState: 'withoutImage' },
};

export const LongTitle: Story = {
  name: '긴 제목',
  args: { postState: 'longTitle' },
};

export const LongWriterName: Story = {
  name: '긴 작성자 이름',
  args: { postState: 'longWriterName' },
};

export const NotFound: Story = {
  name: '없는 게시글 (404)',
  args: { postState: 'notFound' },
};

export const Loading: Story = {
  name: '로딩',
  args: { isLoading: true },
};
